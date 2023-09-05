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
const { save, saveResults } = require('./db');

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
        
        socket.write(ACK);

        data = data.toString();

        fileSystem.appendFile('log/Advia560_RAW.txt', data+"", (err) => {});

        buffer += data;

        if ( data.includes(EOT) || (buffer.includes("Serial No") && buffer.includes("MPV")) ) {
            parse(buffer);
            buffer = "";            
        }
		
    });

});

function isNumeric(str) {
    if (typeof str != "string") return false
    return !isNaN(str) && !isNaN(parseFloat(str))
}

let parse = ( buffer, separator = CR ) => {

    let rawLines = buffer.split("\n");

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
    };
    
    let resultHeaders = ["WBC", "LYM", "NEU", "MON", "EOS", "BAS", "LY%", "NE%", "MO%", "EO%", "BA%", "RBC", "HGB", "HCT", "MCV", 
    "MCH", "MCHC", "RDWc", "RDWs", "PLT", "MPV"];

    for( let line of rawLines ) {
        if (line.includes("Sample ID:")) {
            result.sid = line.replace("Sample ID:", "").trim();
            result.sampleId = line.replace("Sample ID:", "").trim();
            result.sampleid = line.replace("Sample ID:", "").trim();
        }

        let parts = line.split("\t").filter( x => x.trim().length);

        if(resultHeaders.includes(parts[0])) {
            result.lines.push({
                code: parts[0],
                hostCode: parts[0],
                test: parts[0],
                unit: parts[2],
                result: isNumeric(parts[1])?parts[1]:parts[2]
            });
        }
    }

    if (  result.lines.length ) saveResults(device, result);

    // console.log(JSON.stringify(result, null, 3))

    // {
    //     "name": "Update Order Result",
    //     "request": {
    //         "method": "POST",
    //         "header": [],
    //         "body": {
    //             "mode": "raw",
    //             "raw": "[\r\n  {\r\n    \"orderID\": 0,\r\n    \"labNumber\": \"string\",\r\n    \"parameterID\": 0,\r\n    \"testID\": 0,\r\n    \"unitName\": \"string\",\r\n    \"result\": \"string\",\r\n    \"equipmentID\": 0,\r\n    \"userID\": \"string\",\r\n    \"status\": true,\r\n    \"patientType\": \"string\"\r\n  }\r\n]",
    //             "options": {
    //                 "raw": {
    //                     "language": "json"
    //                 }
    //             }
    //         },
    //         "url": "10.16.6.13:8080/api/Lab/UpdateOrderResult"
    //     },
    //     "response": []
    // }

}

exports.start = (io, conn) => {

    connection = conn;

    server.listen(PORT, () => {
        console.log(`\nAdvia560 host tcp server listening on ${PORT} `.bgBlue);
        // testReq();
    }); 
};

const msg = `Serial No.:	S020735
RecNo:	119
Sample ID:	55
Patient ID:	333
Patient Name:	gere 
Mode:	Human
Doctor:	
Birth(ymd):
Sex:	Male
Test date(ymd):	20230817
Test time(hm):	103200
Param	Flags	Value	Unit	[min-max]
WBC	 	6.21	10^3/uL	[5.00-10.00]
LYM	 	2.11	10^3/uL	[1.30-4.00]
NEU	 	3.45	10^3/uL	[2.00-7.50]
MON	 	0.45	10^3/uL	[0.15-0.70]
EOS	 	0.11	10^3/uL	[0.00-0.50]
BAS	 	0.09	10^3/uL	[0.00-0.15]
LY%	 	34.0	%	[21.0-40.0]
NE%	 	55.6	%	[40.0-75.0]
MO%	H	7.3	%	[3.0-7.0]
EO%	 	1.7	%	[0.0-5.0]
BA%	 	1.4	%	[0.0-1.5]
RBC	H	5.52	10^6/uL	[4.00-5.50]
HGB	 	14.8	g/dL	[12.0-17.4]
HCT	 	46.7	%	[36.0-52.0]
MCV	 	84.4	fL	[76.0-96.0]
MCH	L	26.8	pg	[27.0-32.0]
MCHC	 	31.8	g/dL	[30.0-35.0]
RDWc	 	13.8	%	[0.0-16.0]
RDWs	L	31.0	fL	[46.0-59.0]
PLT	 	264	10^3/uL	[150-400]
MPV	L	6.0	fL	[8.0-15.0]
Warnings:	
DiffImage	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
BasoImage	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
RBCImage	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
PLTImage	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
4E`;

function testReq () {
    // socket = {
    //     write() {

    //     }
    // };
    // parse(msg, "\n");

    parse(msg);
}