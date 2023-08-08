const net               = require('net');
const moment            = require('moment');
const path              = require('path');
const colors            = require("colors");
const astm              = require('./astm/utils');
const fileSystem        = require("fs");
const Sequelize         = require('sequelize');
const { Op }            = require('sequelize');
const axios             = require("axios");
const config            = require("../config");

const AstmSocketReader  = require('./astm/reader');
const AstmSocketParser  = require('./astm/parser');
const { CLOSING } = require('ws');
const { Console } = require('console');
const { save } = require('./db');

let inDir = path.resolve(process.cwd(), 'log', 'C311_in.txt');
let resDir = path.resolve(process.cwd(), 'log', 'C311_out.txt'); 

let device = {
    _id: '1',
    id: 1,
    name: 'Advia560', 
    codes: []
};

let connection;

const PORT = 6600;

const SOH  = String.fromCharCode(1);
const STX  = String.fromCharCode(2);
const ETX  = String.fromCharCode(3);
const EOT  = String.fromCharCode(4);
const ENQ  = String.fromCharCode(5);
const ACK  = String.fromCharCode(6);
const LF  = String.fromCharCode(10);
const VT  = String.fromCharCode(11);
const CR  = String.fromCharCode(13);
const EXT  = String.fromCharCode(15);
const NAK  = String.fromCharCode(21);
const ETB  = String.fromCharCode(23);
const FS  = String.fromCharCode(28);
const GS  = String.fromCharCode(29);
const RS  = String.fromCharCode(30);

let buffer = "";
let socket;

const server = net.createServer( (s) => {
    socket = s;
    socket.setEncoding();

    let remoteAddress = socket.remoteAddress + ':' + socket.remotePort;

    console.log('Advia560 client connected to port ' + PORT);

    socket.on ( 'error', err => console.log(`Socket error`, err.stack) );
    
    socket.on('data', data => {

        data = data.toString();

        fileSystem.appendFile('log/Advia560_RAW.txt', data+"###", (err) => {});

        if ( data.startsWith(VT) ) {
            buffer = "";
        }

        buffer += data;

        if ( data.endsWith(FS) || data.endsWith(FS+CR) ) {
            parse(buffer);
            buffer = "";
        }	
		
    });

});

const timestamp = () => {
    let d = new Date();
    let dd = d.getFullYear();
    let m = d.getMonth() + 1;
    dd +=  m < 10 ? "0" + m : m;

    let day = d.getDate();
    dd +=  day < 10 ? "0" + day : day;

    let hr = d.getHours();
    dd +=  hr < 10 ? "0" + hr : hr;

    let mn = d.getMinutes();
    dd +=  mn < 10 ? "0" + mn : mn;

    let sc = d.getSeconds();
    dd +=  sc < 10 ? "0" + sc : sc;

    return dd;
}

const acknowlegeQuey = ( ctrlID ) => {
    let stamp = timestamp();
    let msg = VT+"MSH|^~\&|||||" + stamp + "||QCK^Q02|" + ctrlID + "|P|2.3.1||||||ASCII|||" + CR
    msg +=       "MSA|AA|"+ ctrlID +"|Message accepted|||0|" + CR;
    msg +=       "ERR|0|" + CR;
    msg +=       "QAK|SR|OK|" + CR + FS + CR;
    socket.write(msg.toString());
    // console.log('Server acknowleged for sample query found');
}


const acknowlege = ( ctrlID ) => {
    let msg = VT+"MSH|^~\&|||||" + timestamp() + "||ACK^R01|" + ctrlID + "|P|2.3.1||||2||ASCII|||" + CR
    msg +=       "MSA|AA|"+ ctrlID +"|Message accepted|||0|" + CR + FS + CR;
    socket.write(msg.toString());
    // console.log('Server acknowleged');
}

let parse = ( msg, separator = CR ) => {

    let result = {
        sid: "",
        sampleId: "",
        sampleid: "",
        _histogram: {},
        devid: 1,
        deviceid: 1,
        devicename: "Advia560",
        deviceName: "Advia560",
        user: "Advia560",
        lines: [],
    }

    let lines = msg.split(separator);
    //let lines = msg.split("\n");

    let msgType = "";
    let ctrlId = 1;
    let QRD = 1;

    for ( let line of lines ) {
        
        // console.log(line);

        fields = line.split("|");
        
        if ( fields[0].includes("MSH") ) {
            //QRY^Q02
            if ( fields[8].includes('QRY^Q02') ) {
                acknowlegeQuey( fields[9] );
                msgType = "query";
                ctrlId = fields[9];
            } else if ( fields[8].includes('ORU$R01') ) {
                acknowlege( fields[9] );
                msgType = "result";
            }
        } else if ( fields[0].includes("QRD") ) {
            QRD = fields[4];
            SID = fields[8];

            // order(QRD, SID, ctrlId);
        } else if ( fields[0].includes("OBR") ) {
            if ( msgType == "query" ) {
                
            } else if ( msgType == "result" ) {
                result.sid = fields[2];
                result.sampleId = fields[2];
                result.sampleid = fields[2];
            }
        } else if ( fields[0].includes("OBX") && msgType == "result" ) {
            // console.log(fields)
            try {
                let res = fields[5].toString();
                if ( res?.length < 10 ) result.lines = [...result.lines, {
                        code: fields[3],
                        hostCode: fields[3],
                        test: fields[4],
                        result: fields[5],
                        unit: fields[6]
                    }];
            } catch(ex) {
                console.log(ex)
            }
        }
    }

    if (  msgType == "result" ) save(device, result);
}

exports.start = (io, conn) => {

    connection = conn;

    server.listen(PORT, () => {
        console.log(`\nAdvia560 host tcp server listening on ${PORT} `.bgBlue);
        // testReq();
    }); 
};

const msg = `MSH|$~\&|SIEMENS_US$ADVIA560||||20220106214422||ORU$R01|012206117|P|2.5|362
NTE|0||D
NTE|2||Leukocytosis?
OBR|1|012206117||1
SPM||||WB|||||||P
OBX|1|TX|WBC||12.61|$10^3/uL|5-10|H|||P
OBX|2|TX|RBC||4.00|$10^6/uL|4-5.5||||P
OBX|3|TX|PLT||160|$10^3/uL|150-400||||P
OBX|4|TX|HGB||12.7|$g/dL|12-17.4||||P
OBX|5|TX|LYM||3.25|$10^3/uL|1.3-4||||P
OBX|6|TX|MON||0.50|$10^3/uL|0.15-0.7||||P
OBX|7|TX|NEU||8.51|$10^3/uL|2-7.5|H|||P
OBX|8|TX|EO||0.25|$10^3/uL|0-0.5||||P
OBX|9|TX|BAS||0.09|$10^3/uL|0-0.15||||P
OBX|10|TX|LYM%||25.8|$%|21-40||||P
OBX|11|TX|MON%||4.0|$%|3-7||||P
OBX|12|TX|NEU%||67.5|$%|40-75||||P
OBX|13|TX|EO%||2.0|$%|0-5||||P
OBX|14|TX|BAS%||0.7|$%|0-1.5||||P
OBX|15|TX|HCT||38.0|$%|36-52||||P
OBX|16|TX|MCV||95.0|$fL|76-96||||P
OBX|17|TX|MCH||31.6|$pg|27-32||||P
OBX|18|TX|MCHC||33.3|$g/dL|30-35||||P
OBX|19|TX|RDWsd||51.2|$fL|46-59||||P
OBX|20|TX|RDWcv||15.6|$%|0-16||||P
OBX|21|TX|MPV||11.4|$fL|8-15||||P
OBX|22|ED|Diff||$$$$iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAMAAABrrFhUAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAMAUExURf///wAA//8A/wBkAP+MAAAAAACAgICAgMDAwP8AAAD/AP//AAAA//8A/wD//////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMwAAZgAAmQAAzAAA/wAzAAAzMwAzZgAzmQAzzAAz/wBmAABmMwBmZgBmmQBmzABm/wCZAACZMwCZZgCZmQCZzACZ/wDMAADMMwDMZgDMmQDMzADM/wD/AAD/MwD/ZgD/mQD/zAD//zMAADMAMzMAZjMAmTMAzDMA/zMzADMzMzMzZjMzmTMzzDMz/zNmADNmMzNmZjNmmTNmzDNm/zOZADOZMzOZZjOZmTOZzDOZ/zPMADPMMzPMZjPMmTPMzDPM/zP/ADP/M###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||||||P
OBX|23|ED|Baso||$$$$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||||||P
OBX|24|ED|Rbc||$$$$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###kN1zEAJ4iugbQTLhcOQHSR97MoAyBBON/FAzBlMRUHIDq3tB1O924Aogt6LIswAHJiOO7qAZhSXaUBiM4q/Yb3ZhmAKVVVGIDojNJ3eO/NAEQX7ZIUZwDkyvDCAASiM8lY4UWRAdimmIIDEJ1DxgzP9/t2AKILNFdmZwBkpmRXZQC2mU2hAYh+zzJ+MtsMQHRRauRiMw9A9HuTXMlq0QHYzVkMgBRKNs0MwDYnmWEAou8tspsMVqt//w0P30IOumAAov++yDkZUdMDcCjHBiD6epG5M4rV6p9/1psR6Cjfnku/m+hrRGpm+igd5evXr5tEz5XOKd979fnz5/WXL1+q59OnT5tEz5WO7x0/XzK+d/x8yZzyvVe/fv1aL5EfP35sEj1XOtvDR8+VjnPHz5eMc8fPT1lsAJbMkjfEknHu+PlRc8q5DUCiOHf8/Kg55dwpB2DJt2VLxrnj50fNKedOOQAi8pLhB+DxbrVeTX9V+Jq7x5fHnx5u/jx28/D07t/rN0/rh5u79ePOY4fOOtY1eH/usV/76bx/z3bK6xo9PvgATBfpZv3wtPf408P6ZrW9WQ58TZd5XN9tXuCdIhw661DXIDj34K/9psx3jy+/3pzpg9f1wOODD8DzjXHzsH7ae3y6ePvL2O+fBNtML+r0Ak9l+FuEQ2cd5xrE58732r8U+tD5Dj0+9gBsVu/lLc8mrzfEuxf98e7vmnaf4wOwPet412BvADK99tNZPzjfocfHHoDpkDs3xfSZcLoIQ94Ef2IANr/O8tq/eWtvAI7nwMV4d3G6zvEB2P56vGuwNwD7GfG13yv/lEPnO/T40AMwHfLvuk+fk15/+vnmwk03Tp8/CIqzV4RDZx3uGrw99/CvfVD+949//HoP/w7gzV8F/bkhXm+Q18d3l7H/vC3ClENnHesavD/3yK/9/l9xrnaG7JzXO9dHABF5EwMgkja/1v8Dv53Q19nw+f4AAAAASUVORK5CYII=||||||P
OBX|25|ED|Plt||$$$$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||||||P
`;

function testReq () {
    socket = {
        write() {

        }
    };
    parse(msg, "\n");
}