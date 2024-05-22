const net = require('net');
const moment = require('moment');
const path = require('path');
const colors = require("colors");
const astm = require('./astm/utils');
const fileSystem = require("fs");
const Sequelize = require('sequelize');
const { Op } = require('sequelize');

const AstmSocketReader = require('./astm/reader');
const AstmSocketParser = require('./astm/parser');
// const Device            = require('../models/device');
const config = require('../config');
const { save, saveResults } = require('./db');

let inDir = path.resolve(process.cwd(), 'log', 'abl800_in.txt');
let resDir = path.resolve(process.cwd(), 'log', 'abl800_out.txt');

let device = {
    _id: '8',
    id: 8,
    name: 'ABL',
    codes: []
};


let sgh;
let connection;

const PORT = 2243;

const SOH = String.fromCharCode(1);
const STX = String.fromCharCode(2);
const ETX = String.fromCharCode(3);
const EOT = String.fromCharCode(4);
const ENQ = String.fromCharCode(5);
const ACK = String.fromCharCode(6);
const LF = String.fromCharCode(10);
const VT = String.fromCharCode(11);
const CR = String.fromCharCode(13);
const EXT = String.fromCharCode(15);
const NAK = String.fromCharCode(21);
const ETB = String.fromCharCode(23);
const FS = String.fromCharCode(28);
const GS = String.fromCharCode(29);
const RS = String.fromCharCode(30);

let buffer = "";

const server = net.createServer((socket) => {
    socket.setEncoding();

    console.log('ABL client connected to port ' + PORT);

    socket.on('error', err => console.log(`Socket error`, err.stack));

    socket.on('data', data => {
        fileSystem.appendFile('./log/abl80_in.txt', data + "\n\n", err => { });
        if ( data.includes(EOT) ) {
            parse(buffer);
            buffer = "";            
        }
    });

});

let parse = (buffer, separator = CR) => {

    let rawLines = buffer.split("\n");
    rawLines = rawLines.map(x => x.trim());
    console.log(rawLines)

    let result = {
        sid: "",
        sampleId: "",
        sampleid: "",
        _histogram: {},
        devid: 16,
        deviceid: 16,
        devicename: "Advia560",
        deviceName: "Advia560",
        user: "Advia560",
        lines: [],
    };

    for (let line of rawLines) {
        let parts = line.split("|");
        if (parts.length > 2 && line.indexOf("O|") > -1 && line.indexOf("O|") < 3) {
            result.sid = parts[3].trim();
            result.sampleId = parts[3].trim();
            result.sampleid = parts[3].trim();
        } else if (parts.length > 3 && line.indexOf("R|") > -1 && line.indexOf("R|") < 3) {
            // R|4|^^^pCO2(T)^C|.....|mmHg||||F
            if (parts[3] != ".....") {
                result.lines.push({
                    code: parts[2].split("^")[3],
                    hostCode: parts[2].split("^")[3],
                    test: parts[2].split("^")[3],
                    unit: parts[4],
                    result: parts[3]
                });
            }
        }
    }

    if (result.lines.length) saveResults(device, result);
}

exports.start = (io, conn, sghConn) => {

    connection = conn;
    sgh = sghConn;

    server.listen(PORT, () => {
        console.log(`\nABL800 host tcp server listening on ${PORT} `.bgBrightCyan);
        test();
    });
};

const test = () => {
    let msg = `1H|\^&|||ABL80 BASIC^319053||||||||1|20231213144712
    F3
    2P|1||30000702||mohamed^hussein
    F3
    3O|1||Sample #^259|||||||ANONYMOUS|||||Arterial^||||||||||F
    23
    4R|1|^^^pH^M|.....|||||F||ANONYMOUS|20231212111700|20231212111700
    77
    5R|2|^^^pH(T)^C|.....|||||F
    ED
    6R|3|^^^pCO2^M|.....|mmHg||||F
    59
    7R|4|^^^pCO2(T)^C|.....|mmHg||||F
    F6
    0R|5|^^^pO2^M|.....|mmHg||||F
    12
    1R|6|^^^pO2(T)^C|.....|mmHg||||F
    AF
    2R|7|^^^Na+^M|132|mmol/L||L||F
    A2
    3R|8|^^^Hct^M|.....|%||||F
    E2
    4R|9|^^^K+^M|3.60|mmol/L||N||F
    75
    5R|10|^^^Ca++^M|1.17|mmol/L||N||F
    22
    6R|11|^^^Cl-^M|89|mmol/L||L||F
    AE
    7R|12|^^^sO2^C|.....|%||||F
    DC
    0R|13|^^^RI^C|.....|%||||F
    7D
    1R|14|^^^pO2(A)^C|.....|mmHg||||F
    CB
    2R|15|^^^AaDpO2^C|.....|mmHg||||F
    21
    3R|16|^^^a/ApO2^C|.....|%||||F
    AA
    4R|17|^^^AaDpO2,T^C|.....|mmHg||||F
    A5
    5R|18|^^^a/ApO2,T^C|.....|%||||F
    2E
    6R|19|^^^RI,T^C|.....|%||||F
    09
    7R|20|^^^pO2(A),T^C|.....|mmHg||||F
    4E
    0R|21|^^^tHb^C|.....|g/dL||||F
    20
    1R|22|^^^SBE^C|.....|mmol/L||||F
    C8
    2R|23|^^^HCO3-^C|.....|mmol/L||||F
    2A
    3R|24|^^^tCO2(P)^C|.....|mmol/L||||F
    CB
    4R|25|^^^Ca(7.4)^C|.....|mmol/L||||F
    82
    5R|26|^^^Anion gap^C|.....|mmol/L||||F
    43
    6R|27|^^^Anion gap (K+)^C|.....|mmol/L||||F
    2C
    7R|28|^^^ABE^C|.....|mmol/L||||F
    C2
    0R|29|^^^cBase(Ecf,ox)^C|.....|mmol/L||||F
    44
    1R|30|^^^SBC^C|.....|mmol/L||||F
    C5
    2R|31|^^^tCO2(B)^C|.....|mmol/L||||F
    BA
    3R|32|^^^cBase(B,ox)^C|.....|mmol/L||||F
    75
    4R|33|^^^tO2^C|.....|Vol%||||F
    0E
    5L|1|N
    08
    `
    parse(msg);
}