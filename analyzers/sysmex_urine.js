const net = require('net');
const moment = require('moment');
const path = require('path');
const colors = require("colors");
const astm = require('./astm/utils');
const fileSystem = require("fs");
const Sequelize = require('sequelize');
const { Op } = require('sequelize');

const config = require('../config');
const AstmSocketReader = require('./astm/reader');
const AstmSocketParser = require('./astm/parser');
// const Device            = require('../models/device');

const { save, saveResults } = require('./db');

let inDir = path.resolve(process.cwd(), 'log', 'sysmex_u_in.txt');
let resDir = path.resolve(process.cwd(), 'log', 'sysmex_u_out.txt');

let device = {
    _id: '64',
    id: 64,
    name: 'SysmexUrine', //urine
    codes: []
};

let sgh;
let connection;

const PORT = 6789;

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


let toRequesition = [];
let msgtosend = [];

const dateString = (extended = true) => {
    let d = new Date();
    d.setHours(d.getHours() - 2);

    let ret = d.getFullYear();
    ret += (d.getMonth() + 1 + '').length == 2 ? d.getMonth() + 1 + '' : '0' + (d.getMonth() + 1) + ''
    ret += (d.getDate() + '').length == 2 ? d.getDate() + '' : '0' + d.getDate() + ''

    if (extended) ret += (d.getHours() + '').length == 2 ? d.getHours() + '' : '0' + d.getHours() + ''
    if (extended) ret += (d.getMinutes() + '').length == 2 ? d.getMinutes() + '' : '0' + d.getMinutes() + ''
    if (extended) ret += (d.getSeconds() + '').length == 2 ? d.getSeconds() + '' : '0' + d.getSeconds() + ''

    return ret;
};

const dateString2 = (hours = true, minutes = true, seconds = true) => {
    let d = new Date();
    let ret = d.getFullYear();
    ret += (d.getMonth() + 1 + '').length == 2 ? d.getMonth() + 1 + '' : '0' + (d.getMonth() + 1) + ''
    ret += (d.getDate() + '').length == 2 ? d.getDate() + '' : '0' + d.getDate() + ''

    if (hours) ret += (d.getHours() + '').length == 2 ? d.getHours() + '' : '0' + d.getHours() + ''
    if (minutes) ret += (d.getMinutes() + '').length == 2 ? d.getMinutes() + '' : '0' + d.getMinutes() + ''
    if (seconds) ret += (d.getSeconds() + '').length == 2 ? d.getSeconds() + '' : '0' + d.getSeconds() + ''

    return ret;
};

const requestMessage = async (lab_id, socket, orderType = 'Q') => {};

const requestInfo = async (lab_id, socket) => {

    let LabNumber = lab_id.toString().replace(/^0+/, '');
    LabNumber = LabNumber.replace(/^0+/, '');
    LabNumber = LabNumber.replace(/@/, '');

    msgtosend = [];

    // let record = `${STX}1H|\\^&||||||||||P|1${CR}`;
    // record    += `P|1${CR}`;
    // record    += `Q|1|^${LabNumber}||^^^ALL||||||||X${CR}`;
    // record    += `L|1|${CR}${ETX}`;



    let record = `${STX}1H|\\^&||||||||||P|1${CR}${ETX}`;
    record = record + astm.checksum(record) + `${CR}${LF}`;
    msgtosend = [...msgtosend, record];

    record = `${STX}2P|1${CR}${ETX}`;
    record = record + astm.checksum(record) + `${CR}${LF}`;
    msgtosend = [...msgtosend, record];

    record = `${STX}3Q|1|^${LabNumber}||^^^ALL||||||||X${CR}${ETX}`;
    record = record + astm.checksum(record) + `${CR}${LF}`;
    msgtosend = [...msgtosend, record];

    record = `${STX}4L|1|${CR}${ETX}`;
    record = record + astm.checksum(record) + `${CR}${LF}`;
    msgtosend = [...msgtosend, record];

    msgtosend.reverse();

    // console.log(msgtosend[0]); 
    fileSystem.appendFile('./log/sysmex_urine_out.txt', msgtosend[0].toString(), err => { });

    if (socket) socket.write(ENQ);
};

const server = net.createServer((socket) => {
    socket.setEncoding();

    console.log('Sysmex-urine client connected to port ' + PORT);

    socket.on('error', err => console.log(`${moment(new Date()).format("YYYY-MM-DD hh:mm:ss")} Archi: Socket error`, err.stack));


    let reader = new AstmSocketReader(socket, inDir);
    let parser = new AstmSocketParser(socket, device, connection, sgh);

    // console.log('parser set to value')

    reader.on('data', data => {
        console.log(data);

        toRequesition = [];
        parser.parse(data, device);
    });
    reader.on('enquired', _ => msgtosend = []);
    reader.on('negativeacknowledged', _ => msgtosend = []);
    reader.on('acknowledged', _ => {
        console.log("ACK");
        if (msgtosend.length) {
            let msg = msgtosend.pop();
            console.dir(`sending: ${msg}`.yellow);
            socket.write(msg);
            fileSystem.appendFile('./data/archi_out.txt', msg.toString(), err => { });
            // reader.write(msg);
        } else {
            // reader.write(EOT);
            socket.write(EOT);
            console.log('EOT'.yellow);

            if (toRequesition.length) {
                let sid = toRequesition.pop();
                requestMessage(sid, socket);
            }
        }
    });

    parser.on('requisition', sid => {
        console.log(sid + " to request");
        toRequesition = [...toRequesition, sid]
    });
    parser.on('results', results => saveResults(device, results));
    parser.on('startDownload', _ => {
        console.log('startDownload' + JSON.stringify(toRequesition, undefined, 4));
        if (toRequesition.length) {
            let sid = toRequesition.pop();
            requestMessage(sid, socket);
        }
    });


    // requestInfo('91237', socket, 'O');

});


exports.start = (io, conn, sghConn) => {

    connection = conn;
    sgh = sghConn;

    server.listen(PORT, () => {
        console.log(`\nSysmex-urine host tcp server listening on ${PORT} `.bgMagenta);
        // test(conn, sgh);
        // setTimeout(testClient, 2000);
    });
};

const testClient = () => {
    let msg = `1H|^&|||U-WAM^00-22_Build003^A5912^^^^AU501736||||||||LIS2-A2|20231212111250
    72
    2P|1|||||||U
    F8
    3O|1|44014||^^^RBC^^^EC^^^Squa.EC^^^Non SEC^^^CAST^^^BACT^^^X'TAL^^^YLC^^^SPERM^^^MUCUS^^^WBC^^^WBC Clumps^^^RBC-Info.^^^UTI-Info.^^^BACT-Info.^^^SF_DSS_PxSF_FSC_P^^^CB_FLH_PxCB_FSC_P|R||20231212110244||||N|||20231212110244|2D
    4*||||||||||F
    8C
    5R|1|^^^RBC^A^1^S|48.9^RAW|/�l||N||||^^device||20231212111143|UF-5000
    0E
    6R|2|^^^RBC^A^1^S|6-10/HPF^MAINFORMAT|||N||||^^device||20231212111143|UF-5000
    C2
    7R|3|^^^EC^A^1^S|8.5^RAW|/�l||N||||^^device||20231212111143|UF-5000
    8B
    0R|4|^^^EC^A^1^S|NIL^MAINFORMAT|||N||||^^device||20231212111143|UF-5000
    81
    1R|5|^^^Squa.EC^A^1^S|2.0^RAW|/�l||N||||^^device||20231212111143|UF-5000
    44
    2R|6|^^^Squa.EC^A^1^S|NIL^MAINFORMAT|||N||||^^device||20231212111143|UF-5000
    4D
    3R|7|^^^Non SEC^A^1^S|6.5^RAW|/�l||N||||^^device||20231212111143|UF-5000
    27
    4R|8|^^^Non SEC^A^1^S|1+^MAINFORMAT|||N||||^^device||20231212111143|UF-5000
    A0
    5R|9|^^^CAST^A^1^S|0.80^RAW|/�l||N||||^^device||20231212111143|UF-5000
    5D
    6R|10|^^^CAST^A^1^S|NIL/LPF^MAINFORMAT|||N||||^^device||20231212111143|UF-5000
    68
    7R|11|^^^BACT^A^1^S|27.9^RAW|/�l||N||||^^device||20231212111143|UF-5000
    81
    0R|12|^^^BACT^A^1^S|NIL^MAINFORMAT|||N||||^^device||20231212111143|UF-5000
    42
    1R|13|^^^X'TAL^A^1^S|0.0^RAW|/�l||N||||^^device||20231212111143|UF-5000
    81
    2R|14|^^^X'TAL^A^1^S|NIL^MAINFORMAT|||N||||^^device||20231212111143|UF-5000
    8C
    3R|15|^^^YLC^A^1^S|0.5^RAW|/�l||N||||^^device||20231212111143|UF-5000
    12
    4R|16|^^^YLC^A^1^S|NIL^MAINFORMAT|||N||||^^device||20231212111143|UF-5000
    18
    5R|17|^^^SPERM^A^1^S|0.0^RAW|/�l||N||||^^device||20231212111143|UF-5000
    B0
    6R|18|^^^SPERM^A^1^S|NIL^MAINFORMAT|||N||||^^device||20231212111143|UF-5000
    BB
    7R|19|^^^MUCUS^A^1^S|0.53^RAW|/�l||N||||^^device||20231212111143|UF-5000
    F2
    0R|20|^^^MUCUS^A^1^S|NIL^MAINFORMAT|||N||||^^device||20231212111143|UF-5000
    B4
    1R|21|^^^WBC^A^1^S|54.3^RAW|/�l||N||||^^device||20231212111143|UF-5000
    38
    2R|22|^^^WBC^A^1^S|6-10/HPF^MAINFORMAT|||N||||^^device||20231212111143|UF-5000
    F5
    3R|23|^^^WBC Clumps^A^1^S|1.4^RAW|/�l||N||||^^device||20231212111143|UF-5000
    99
    4R|24|^^^WBC Clumps^A^1^S|Absent^MAINFORMAT|||N||||^^device||20231212111143|UF-5000
    19
    5R|25|^^^RBC-Info.^A^1^S|1^RAW|||||||^^device||20231212111143|UF-5000
    EB
    6R|26|^^^RBC-Info.^A^1^S|1^MAINFORMAT|||||||^^device||20231212111143|UF-5000
    F1
    7R|27|^^^UTI-Info.^A^1^S|1^RAW|||||||^^device||20231212111143|UF-5000
    0A
    0R|28|^^^UTI-Info.^A^1^S|1^MAINFORMAT|||||||^^device||20231212111143|UF-5000
    08
    1R|29|^^^BACT-Info.^A^1^S|0^RAW|||||||^^device||20231212111143|UF-5000
    2D
    2R|30|^^^BACT-Info.^A^1^S|0^MAINFORMAT|||||||^^device||20231212111143|UF-5000
    2A
    3R|31|^^^SF_DSS_PxSF_FSC_P^A^1^IF|20231212&R&PNG&E&R&E&[UF-5000&S&14894]&E&[20231212_111143]&E&R&E&[STAT000000000000000001]_[SF_DSS_PxSF_FSC_P].png^RAW|||||||^^device||20231212111143|UF-5000
    70
    4R|32|^^^CB_FLH_PxCB_FSC_P^A^1^IF|20231212&R&PNG&E&R&E&[UF-5000&S&14894]&E&[20231212_111143]&E&R&E&[STAT000000000000000001]_[CB_FLH_PxCB_FSC_P].png^RAW|||||||^^device||20231212111143|UF-5000
    02
    5L|1|N
    08
    `;

    let messages = msg.split(STX);    

    var client = new net.Socket();
    client.connect(PORT, '127.0.0.1', function () {
        console.log('Connected');
        client.write(ENQ);

        for (let frame of messages ) {
            client.write(STX + frame);
        }
    });

    client.on('data', function (data) {
        // console.log('Received: ' + data);
        client.destroy(); // kill client after server's response
    });

    client.on('close', function () {
        console.log('Connection closed');
    });
}

const test = (connection, sgh) => {

    let parser = new AstmSocketParser({}, device, connection, sgh);
    parser.on('results', results => saveResults(device, results));
    parser.on('requisition', sid => {
        console.log(sid + " to request");
        // toRequesition = [...toRequesition, sid]
        // requestMessage ( sid , null, connection, sgh );
    });

    ////////////////////////////////////////////////////////////////////////////////////////////////
    // test data ///////////////////////////////////////////////////////////////////////////////////
    let data = `1H|\^&|||U-WAM^00-22_Build003^A5912^^^^AU501736||||||||LIS2-A2|20231019110350
    77
    2P|1|||||||U
    F8
    3O|1|346205||^^^C-URO\^^^C-BLD\^^^C-BIL\^^^C-KET\^^^C-GLU\^^^C-PRO\^^^C-PH\^^^C-NIT\^^^C-LEU\^^^C-CRE\^^^C-ALB\^^^C-P/C\^^^C-A/C\^^^C-S.G.(Ref)\^^^C-COLOR\^^^C-ColorRANK\^^^C-CLOUD\^^^C-Error Code\^^^RBC\^^^NL RBC\^^^EC\^^^Squa.EC\^^^Non SEC7F
    4\^^^Tran.EC\^^^RTEC\^^^CAST\^^^Hy.CAST\^^^Path.CAST\^^^BACT\^^^X'TAL\^^^YLC\^^^SPERM\^^^MUCUS\^^^WBC\^^^WBC Clumps\^^^RBC-Info.\^^^UTI-Info.\^^^BACT-Info.\^^^SF_DSS_PxSF_FSC_P\^^^HIST_SF_FSC_P\^^^CW_SSH_AxCW_FSC_W\^^^CW_FLL_AxCW_FSC_W\^^^CBB0
    5_FLH_PxCB_FSC_P\^^^SF_FLL_WxSF_FLL_A\^^^CW_FLH_PxCW_FSC_P\^^^CW_SSH_PxCW_FLL_P\^^^HIST_CW_SSH_P\|R||20230626143228||||N|||20230626143228|*||||||||||F
    CF
    6R|1|^^^C-URO^A^1^S^  0004^01|^RAW|mg/dL||N||||^^device||20230626143526|UC-3500
    61
    7R|2|^^^C-URO^A^1^S^  0004^01|^MAINFORMAT|�mol/L||N||||^^device||20230626143526|UC-3500
    2C
    0R|3|^^^C-BLD^A^1^S^  0004^01|^RAW|mg/dL||N||||^^device||20230626143526|UC-3500
    39
    1R|4|^^^C-BLD^A^1^S^  0004^01|^MAINFORMAT|mg/dL||N||||^^device||20230626143526|UC-3500
    3F
    2R|5|^^^C-BIL^A^1^S^  0004^01|^RAW|mg/dL||N||||^^device||20230626143526|UC-3500
    42
    3R|6|^^^C-BIL^A^1^S^  0004^01|^MAINFORMAT|�mol/L||N||||^^device||20230626143526|UC-3500
    0D
    4R|7|^^^C-KET^A^1^S^  0004^01|^RAW|mg/dL||N||||^^device||20230626143526|UC-3500
    53
    5R|8|^^^C-KET^A^1^S^  0004^01|^MAINFORMAT|mmol/L||N||||^^device||20230626143526|UC-3500
    D6
    6R|9|^^^C-GLU^A^1^S^  0004^01|^RAW|mg/dL||N||||^^device||20230626143526|UC-3500
    5B
    7R|10|^^^C-GLU^A^1^S^  0004^01|^MAINFORMAT|mmol/L||N||||^^device||20230626143526|UC-3500
    05
    0R|11|^^^C-PRO^A^1^S^  0004^01|^RAW|mg/dL||N||||^^device||20230626143526|UC-3500
    87
    1R|12|^^^C-PRO^A^1^S^  0004^01|^MAINFORMAT|g/L||N||||^^device||20230626143526|UC-3500
    BC
    2R|13|^^^C-PH^A^1^S^  0004^01|5.5^RAW|||N||||^^device||20230626143526|UC-3500
    17
    3R|14|^^^C-PH^A^1^S^  0004^01|^MAINFORMAT|||N||||^^device||20230626143526|UC-3500
    85
    4R|15|^^^C-NIT^A^1^S^  0004^01|-^RAW|||N||||^^device||20230626143526|UC-3500
    03
    5R|16|^^^C-NIT^A^1^S^  0004^01|-^MAINFORMAT|||N||||^^device||20230626143526|UC-3500
    09
    6R|17|^^^C-LEU^A^1^S^  0004^01|^RAW|c/�L||N||||^^device||20230626143526|UC-3500
    68
    7R|18|^^^C-LEU^A^1^S^  0004^01|^MAINFORMAT|c/�L||N||||^^device||20230626143526|UC-3500
    6E
    0R|19|^^^C-CRE^A^1^S^  0004^01|10^RAW|mg/dL||N||||^^device||20230626143526|UC-3500
    D9
    1R|20|^^^C-CRE^A^1^S^  0004^01|0.1^MAINFORMAT|g/L||N||||^^device||20230626143526|UC-3500
    33
    2R|21|^^^C-ALB^A^1^S^  0004^01|10^RAW|mg/L||N||||^^device||20230626143526|UC-3500
    65
    3R|22|^^^C-ALB^A^1^S^  0004^01|0.01^MAINFORMAT|g/L||N||||^^device||20230626143526|UC-3500
    5C
    4R|23|^^^C-P/C^A^1^S^  0004^01|^RAW|g/gCr||N||||^^device||20230626143526|UC-3500
    5E
    5R|24|^^^C-P/C^A^1^S^  0004^01|^MAINFORMAT|g/gCr||N||||^^device||20230626143526|UC-3500
    64
    6R|25|^^^C-A/C^A^1^S^  0004^01|^RAW|mg/gCr||N||||^^device||20230626143526|UC-3500
    C0
    7R|26|^^^C-A/C^A^1^S^  0004^01|^MAINFORMAT|mg/gCr||N||||^^device||20230626143526|UC-3500
    C6
    0R|27|^^^C-S.G.(Ref)^A^1^S^  0004^01|1.005^RAW|||N||||^^device||20230626143526|UC-3500
    42
    1R|28|^^^C-S.G.(Ref)^A^1^S^  0004^01|^MAINFORMAT|||N||||^^device||20230626143526|UC-3500
    54
    2R|29|^^^C-COLOR^A^1^S^  0004^01|L YELLOW  01^RAW|||N||||^^device||20230626143526|UC-3500
    56
    3R|30|^^^C-COLOR^A^1^S^  0004^01|L YELLOW  01^MAINFORMAT|||N||||^^device||20230626143526|UC-3500
    53
    4R|31|^^^C-ColorRANK^A^1^S^  0004^01|^RAW|||N||||^^device||20230626143526|UC-3500
    14
    5R|32|^^^C-ColorRANK^A^1^S^  0004^01|^MAINFORMAT|||N||||^^device||20230626143526|UC-3500
    1A
    6R|33|^^^C-CLOUD^A^1^S^  0004^01|-^RAW|||N||||^^device||20230626143526|UC-3500
    91
    7R|34|^^^C-CLOUD^A^1^S^  0004^01|-^MAINFORMAT|||N||||^^device||20230626143526|UC-3500
    97
    0R|35|^^^C-Error Code^A^1^S^  0004^01|9901^RAW|||N||||^^device||20230626143526|UC-3500
    61
    1R|36|^^^C-Error Code^A^1^S^  0004^01|9901^MAINFORMAT|||N||||^^device||20230626143526|UC-3500
    67
    2R|37|^^^RBC^A^1^S^  0004^01|0.4^RAW|/�l||N||||^^device||20230626141745|UF-5000
    37
    3R|38|^^^RBC^A^1^S^  0004^01|0.4^MAINFORMAT|/�l||N||||^^device||20230626141745|UF-5000
    3D
    4R|39|^^^NL RBC^A^1^S^  0004^01|0.2^RAW|/�l||N||||^^device||20230626141745|UF-5000
    F3
    5R|40|^^^NL RBC^A^1^S^  0004^01|0.2^MAINFORMAT|/�l||N||||^^device||20230626141745|UF-5000
    F0
    6R|41|^^^EC^A^1^S^  0004^01|0.5^RAW|/�l||N||||^^device||20230626141745|UF-5000
    E8
    7R|42|^^^EC^A^1^S^  0004^01|0.5^MAINFORMAT|/�l||N||||^^device||20230626141745|UF-5000
    EE
    0R|43|^^^Squa.EC^A^1^S^  0004^01|0.5^RAW|/�l||N||||^^device||20230626141745|UF-5000
    AC
    1R|44|^^^Squa.EC^A^1^S^  0004^01|0.5^MAINFORMAT|/�l||N||||^^device||20230626141745|UF-5000
    B2
    2R|45|^^^Non SEC^A^1^S^  0004^01|0.0^RAW|/�l||N||||^^device||20230626141745|UF-5000
    81
    3R|46|^^^Non SEC^A^1^S^  0004^01|0.0^MAINFORMAT|/�l||N||||^^device||20230626141745|UF-5000
    87
    4R|47|^^^Tran.EC^A^1^S^  0004^01|0.0^RAW|/�l||N||||^^device||20230626141745|UF-5000
    AA
    5R|48|^^^Tran.EC^A^1^S^  0004^01|0.0^MAINFORMAT|/�l||N||||^^device||20230626141745|UF-5000
    B0
    6R|49|^^^RTEC^A^1^S^  0004^01|0.0^RAW|/�l||N||||^^device||20230626141745|UF-5000
    91
    7R|50|^^^RTEC^A^1^S^  0004^01|0.0^MAINFORMAT|/�l||N||||^^device||20230626141745|UF-5000
    8E
    0R|51|^^^CAST^A^1^S^  0004^01|0.00^RAW|/�l||N||||^^device||20230626141745|UF-5000
    B1
    1R|52|^^^CAST^A^1^S^  0004^01|0.00^MAINFORMAT|/�l||N||||^^device||20230626141745|UF-5000
    B7
    2R|53|^^^Hy.CAST^A^1^S^  0004^01|0.00^RAW|/�l||N||||^^device||20230626141745|UF-5000
    A4
    3R|54|^^^Hy.CAST^A^1^S^  0004^01|0.00^MAINFORMAT|/�l||N||||^^device||20230626141745|UF-5000
    AA
    4R|55|^^^Path.CAST^A^1^S^  0004^01|0.00^RAW|/�l||N||||^^device||20230626141745|UF-5000
    74
    5R|56|^^^Path.CAST^A^1^S^  0004^01|0.00^MAINFORMAT|/�l||N||||^^device||20230626141745|UF-5000
    7A
    6R|57|^^^BACT^A^1^S^  0004^01|4.4^RAW|/�l||N||||^^device||20230626141745|UF-5000
    84
    7R|58|^^^BACT^A^1^S^  0004^01|4.4^MAINFORMAT|/�l||N||||^^device||20230626141745|UF-5000
    8A
    0R|59|^^^X'TAL^A^1^S^  0004^01|0.0^RAW|/�l||N||||^^device||20230626141745|UF-5000
    BE
    1R|60|^^^X'TAL^A^1^S^  0004^01|0.0^MAINFORMAT|/�l||N||||^^device||20230626141745|UF-5000
    BB
    2R|61|^^^YLC^A^1^S^  0004^01|0.1^RAW|/�l||N||||^^device||20230626141745|UF-5000
    42
    3R|62|^^^YLC^A^1^S^  0004^01|0.1^MAINFORMAT|/�l||N||||^^device||20230626141745|UF-5000
    48
    4R|63|^^^SPERM^A^1^S^  0004^01|0.0^RAW|/�l||N||||^^device||20230626141745|UF-5000
    E4
    5R|64|^^^SPERM^A^1^S^  0004^01|0.0^MAINFORMAT|/�l||N||||^^device||20230626141745|UF-5000
    EA
    6R|65|^^^MUCUS^A^1^S^  0004^01|0.00^RAW|/�l||N||||^^device||20230626141745|UF-5000
    1E
    7R|66|^^^MUCUS^A^1^S^  0004^01|0.00^MAINFORMAT|/�l||N||||^^device||20230626141745|UF-5000
    24
    0R|67|^^^WBC^A^1^S^  0004^01|0.2^RAW|/�l||N||||^^device||20230626141745|UF-5000
    3B
    1R|68|^^^WBC^A^1^S^  0004^01|0.2^MAINFORMAT|/�l||N||||^^device||20230626141745|UF-5000
    41
    2R|69|^^^WBC Clumps^A^1^S^  0004^01|0.0^RAW|/�l||N||||^^device||20230626141745|UF-5000
    D1
    3R|70|^^^WBC Clumps^A^1^S^  0004^01|0.0^MAINFORMAT|/�l||N||||^^device||20230626141745|UF-5000
    CE
    4R|71|^^^RBC-Info.^A^1^S^  0004^01|0^RAW|||||||^^device||20230626141745|UF-5000
    1E
    5R|72|^^^RBC-Info.^A^1^S^  0004^01|0^MAINFORMAT|||||||^^device||20230626141745|UF-5000
    24
    6R|73|^^^UTI-Info.^A^1^S^  0004^01|0^RAW|||||||^^device||20230626141745|UF-5000
    3D
    7R|74|^^^UTI-Info.^A^1^S^  0004^01|0^MAINFORMAT|||||||^^device||20230626141745|UF-5000
    43
    0R|75|^^^BACT-Info.^A^1^S^  0004^01|0^RAW|||||||^^device||20230626141745|UF-5000
    61
    1R|76|^^^BACT-Info.^A^1^S^  0004^01|0^MAINFORMAT|||||||^^device||20230626141745|UF-5000
    67
    2R|77|^^^SF_DSS_PxSF_FSC_P^A^1^IF^  0004^01|20230626&R&PNG&E&R&E&[UF-5000&S&14894]&E&[20230626_141745]&E&R&E&[        ERR01000000001]_[SF_DSS_PxSF_FSC_P].png^RAW|||||||^^device||20230626141745|UF-5000
    26
    3R|78|^^^HIST_SF_FSC_P^A^1^IF^  0004^01|20230626&R&PNG&E&R&E&[UF-5000&S&14894]&E&[20230626_141745]&E&R&E&[        ERR01000000001]_[HIST_SF_FSC_P].png^RAW|||||||^^device||20230626141745|UF-5000
    44
    4R|79|^^^CW_SSH_AxCW_FSC_W^A^1^IF^  0004^01|20230626&R&PNG&E&R&E&[UF-5000&S&14894]&E&[20230626_141745]&E&R&E&[        ERR01000000001]_[CW_SSH_AxCW_FSC_W].png^RAW|||||||^^device||20230626141745|UF-5000
    26
    5R|80|^^^CW_FLL_AxCW_FSC_W^A^1^IF^  0004^01|20230626&R&PNG&E&R&E&[UF-5000&S&14894]&E&[20230626_141745]&E&R&E&[        ERR01000000001]_[CW_FLL_AxCW_FSC_W].png^RAW|||||||^^device||20230626141745|UF-5000
    FF
    6R|81|^^^CB_FLH_PxCB_FSC_P^A^1^IF^  0004^01|20230626&R&PNG&E&R&E&[UF-5000&S&14894]&E&[20230626_141745]&E&R&E&[        ERR01000000001]_[CB_FLH_PxCB_FSC_P].png^RAW|||||||^^device||20230626141745|UF-5000
    B5
    7R|82|^^^SF_FLL_WxSF_FLL_A^A^1^IF^  0004^01|20230626&R&PNG&E&R&E&[UF-5000&S&14894]&E&[20230626_141745]&E&R&E&[        ERR01000000001]_[SF_FLL_WxSF_FLL_A].png^RAW|||||||^^device||20230626141745|UF-5000
    03
    0R|83|^^^CW_FLH_PxCW_FSC_P^A^1^IF^  0004^01|20230626&R&PNG&E&R&E&[UF-5000&S&14894]&E&[20230626_141745]&E&R&E&[        ERR01000000001]_[CW_FLH_PxCW_FSC_P].png^RAW|||||||^^device||20230626141745|UF-5000
    05
    1R|84|^^^CW_SSH_PxCW_FLL_P^A^1^IF^  0004^01|20230626&R&PNG&E&R&E&[UF-5000&S&14894]&E&[20230626_141745]&E&R&E&[        ERR01000000001]_[CW_SSH_PxCW_FLL_P].png^RAW|||||||^^device||20230626141745|UF-5000
    33
    2R|85|^^^HIST_CW_SSH_P^A^1^IF^  0004^01|20230626&R&PNG&E&R&E&[UF-5000&S&14894]&E&[20230626_141745]&E&R&E&[        ERR01000000001]_[HIST_CW_SSH_P].png^RAW|||||||^^device||20230626141745|UF-5000
    67
    3L|1|N
    06
    `;

    ////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////
    // Q|1|^SID1234||^^^ALL||||||||X
    // Host to archi => no order to this sid
    ////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////

    parser.parse(data, device);

    ////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////
};


let testRawResult = `1H|\^&|||U-WAM^00-22_Build003^A5912^^^^AU501736||||||||LIS2-A2|20231019110350
77
2P|1|||||||U
F8
3O|1|346205||^^^C-URO\^^^C-BLD\^^^C-BIL\^^^C-KET\^^^C-GLU\^^^C-PRO\^^^C-PH\^^^C-NIT\^^^C-LEU\^^^C-CRE\^^^C-ALB\^^^C-P/C\^^^C-A/C\^^^C-S.G.(Ref)\^^^C-COLOR\^^^C-ColorRANK\^^^C-CLOUD\^^^C-Error Code\^^^RBC\^^^NL RBC\^^^EC\^^^Squa.EC\^^^Non SEC7F
4\^^^Tran.EC\^^^RTEC\^^^CAST\^^^Hy.CAST\^^^Path.CAST\^^^BACT\^^^X'TAL\^^^YLC\^^^SPERM\^^^MUCUS\^^^WBC\^^^WBC Clumps\^^^RBC-Info.\^^^UTI-Info.\^^^BACT-Info.\^^^SF_DSS_PxSF_FSC_P\^^^HIST_SF_FSC_P\^^^CW_SSH_AxCW_FSC_W\^^^CW_FLL_AxCW_FSC_W\^^^CBB0
5_FLH_PxCB_FSC_P\^^^SF_FLL_WxSF_FLL_A\^^^CW_FLH_PxCW_FSC_P\^^^CW_SSH_PxCW_FLL_P\^^^HIST_CW_SSH_P\|R||20230626143228||||N|||20230626143228|*||||||||||F
CF
6R|1|^^^C-URO^A^1^S^  0004^01|^RAW|mg/dL||N||||^^device||20230626143526|UC-3500
61
7R|2|^^^C-URO^A^1^S^  0004^01|^MAINFORMAT|�mol/L||N||||^^device||20230626143526|UC-3500
2C
0R|3|^^^C-BLD^A^1^S^  0004^01|^RAW|mg/dL||N||||^^device||20230626143526|UC-3500
39
1R|4|^^^C-BLD^A^1^S^  0004^01|^MAINFORMAT|mg/dL||N||||^^device||20230626143526|UC-3500
3F
2R|5|^^^C-BIL^A^1^S^  0004^01|^RAW|mg/dL||N||||^^device||20230626143526|UC-3500
42
3R|6|^^^C-BIL^A^1^S^  0004^01|^MAINFORMAT|�mol/L||N||||^^device||20230626143526|UC-3500
0D
4R|7|^^^C-KET^A^1^S^  0004^01|^RAW|mg/dL||N||||^^device||20230626143526|UC-3500
53
5R|8|^^^C-KET^A^1^S^  0004^01|^MAINFORMAT|mmol/L||N||||^^device||20230626143526|UC-3500
D6
6R|9|^^^C-GLU^A^1^S^  0004^01|^RAW|mg/dL||N||||^^device||20230626143526|UC-3500
5B
7R|10|^^^C-GLU^A^1^S^  0004^01|^MAINFORMAT|mmol/L||N||||^^device||20230626143526|UC-3500
05
0R|11|^^^C-PRO^A^1^S^  0004^01|^RAW|mg/dL||N||||^^device||20230626143526|UC-3500
87
1R|12|^^^C-PRO^A^1^S^  0004^01|^MAINFORMAT|g/L||N||||^^device||20230626143526|UC-3500
BC
2R|13|^^^C-PH^A^1^S^  0004^01|5.5^RAW|||N||||^^device||20230626143526|UC-3500
17
3R|14|^^^C-PH^A^1^S^  0004^01|^MAINFORMAT|||N||||^^device||20230626143526|UC-3500
85
4R|15|^^^C-NIT^A^1^S^  0004^01|-^RAW|||N||||^^device||20230626143526|UC-3500
03
5R|16|^^^C-NIT^A^1^S^  0004^01|-^MAINFORMAT|||N||||^^device||20230626143526|UC-3500
09
6R|17|^^^C-LEU^A^1^S^  0004^01|^RAW|c/�L||N||||^^device||20230626143526|UC-3500
68
7R|18|^^^C-LEU^A^1^S^  0004^01|^MAINFORMAT|c/�L||N||||^^device||20230626143526|UC-3500
6E
0R|19|^^^C-CRE^A^1^S^  0004^01|10^RAW|mg/dL||N||||^^device||20230626143526|UC-3500
D9
1R|20|^^^C-CRE^A^1^S^  0004^01|0.1^MAINFORMAT|g/L||N||||^^device||20230626143526|UC-3500
33
2R|21|^^^C-ALB^A^1^S^  0004^01|10^RAW|mg/L||N||||^^device||20230626143526|UC-3500
65
3R|22|^^^C-ALB^A^1^S^  0004^01|0.01^MAINFORMAT|g/L||N||||^^device||20230626143526|UC-3500
5C
4R|23|^^^C-P/C^A^1^S^  0004^01|^RAW|g/gCr||N||||^^device||20230626143526|UC-3500
5E
5R|24|^^^C-P/C^A^1^S^  0004^01|^MAINFORMAT|g/gCr||N||||^^device||20230626143526|UC-3500
64
6R|25|^^^C-A/C^A^1^S^  0004^01|^RAW|mg/gCr||N||||^^device||20230626143526|UC-3500
C0
7R|26|^^^C-A/C^A^1^S^  0004^01|^MAINFORMAT|mg/gCr||N||||^^device||20230626143526|UC-3500
C6
0R|27|^^^C-S.G.(Ref)^A^1^S^  0004^01|1.005^RAW|||N||||^^device||20230626143526|UC-3500
42
1R|28|^^^C-S.G.(Ref)^A^1^S^  0004^01|^MAINFORMAT|||N||||^^device||20230626143526|UC-3500
54
2R|29|^^^C-COLOR^A^1^S^  0004^01|L YELLOW  01^RAW|||N||||^^device||20230626143526|UC-3500
56
3R|30|^^^C-COLOR^A^1^S^  0004^01|L YELLOW  01^MAINFORMAT|||N||||^^device||20230626143526|UC-3500
53
4R|31|^^^C-ColorRANK^A^1^S^  0004^01|^RAW|||N||||^^device||20230626143526|UC-3500
14
5R|32|^^^C-ColorRANK^A^1^S^  0004^01|^MAINFORMAT|||N||||^^device||20230626143526|UC-3500
1A
6R|33|^^^C-CLOUD^A^1^S^  0004^01|-^RAW|||N||||^^device||20230626143526|UC-3500
91
7R|34|^^^C-CLOUD^A^1^S^  0004^01|-^MAINFORMAT|||N||||^^device||20230626143526|UC-3500
97
0R|35|^^^C-Error Code^A^1^S^  0004^01|9901^RAW|||N||||^^device||20230626143526|UC-3500
61
1R|36|^^^C-Error Code^A^1^S^  0004^01|9901^MAINFORMAT|||N||||^^device||20230626143526|UC-3500
67
2R|37|^^^RBC^A^1^S^  0004^01|0.4^RAW|/�l||N||||^^device||20230626141745|UF-5000
37
3R|38|^^^RBC^A^1^S^  0004^01|0.4^MAINFORMAT|/�l||N||||^^device||20230626141745|UF-5000
3D
4R|39|^^^NL RBC^A^1^S^  0004^01|0.2^RAW|/�l||N||||^^device||20230626141745|UF-5000
F3
5R|40|^^^NL RBC^A^1^S^  0004^01|0.2^MAINFORMAT|/�l||N||||^^device||20230626141745|UF-5000
F0
6R|41|^^^EC^A^1^S^  0004^01|0.5^RAW|/�l||N||||^^device||20230626141745|UF-5000
E8
7R|42|^^^EC^A^1^S^  0004^01|0.5^MAINFORMAT|/�l||N||||^^device||20230626141745|UF-5000
EE
0R|43|^^^Squa.EC^A^1^S^  0004^01|0.5^RAW|/�l||N||||^^device||20230626141745|UF-5000
AC
1R|44|^^^Squa.EC^A^1^S^  0004^01|0.5^MAINFORMAT|/�l||N||||^^device||20230626141745|UF-5000
B2
2R|45|^^^Non SEC^A^1^S^  0004^01|0.0^RAW|/�l||N||||^^device||20230626141745|UF-5000
81
3R|46|^^^Non SEC^A^1^S^  0004^01|0.0^MAINFORMAT|/�l||N||||^^device||20230626141745|UF-5000
87
4R|47|^^^Tran.EC^A^1^S^  0004^01|0.0^RAW|/�l||N||||^^device||20230626141745|UF-5000
AA
5R|48|^^^Tran.EC^A^1^S^  0004^01|0.0^MAINFORMAT|/�l||N||||^^device||20230626141745|UF-5000
B0
6R|49|^^^RTEC^A^1^S^  0004^01|0.0^RAW|/�l||N||||^^device||20230626141745|UF-5000
91
7R|50|^^^RTEC^A^1^S^  0004^01|0.0^MAINFORMAT|/�l||N||||^^device||20230626141745|UF-5000
8E
0R|51|^^^CAST^A^1^S^  0004^01|0.00^RAW|/�l||N||||^^device||20230626141745|UF-5000
B1
1R|52|^^^CAST^A^1^S^  0004^01|0.00^MAINFORMAT|/�l||N||||^^device||20230626141745|UF-5000
B7
2R|53|^^^Hy.CAST^A^1^S^  0004^01|0.00^RAW|/�l||N||||^^device||20230626141745|UF-5000
A4
3R|54|^^^Hy.CAST^A^1^S^  0004^01|0.00^MAINFORMAT|/�l||N||||^^device||20230626141745|UF-5000
AA
4R|55|^^^Path.CAST^A^1^S^  0004^01|0.00^RAW|/�l||N||||^^device||20230626141745|UF-5000
74
5R|56|^^^Path.CAST^A^1^S^  0004^01|0.00^MAINFORMAT|/�l||N||||^^device||20230626141745|UF-5000
7A
6R|57|^^^BACT^A^1^S^  0004^01|4.4^RAW|/�l||N||||^^device||20230626141745|UF-5000
84
7R|58|^^^BACT^A^1^S^  0004^01|4.4^MAINFORMAT|/�l||N||||^^device||20230626141745|UF-5000
8A
0R|59|^^^X'TAL^A^1^S^  0004^01|0.0^RAW|/�l||N||||^^device||20230626141745|UF-5000
BE
1R|60|^^^X'TAL^A^1^S^  0004^01|0.0^MAINFORMAT|/�l||N||||^^device||20230626141745|UF-5000
BB
2R|61|^^^YLC^A^1^S^  0004^01|0.1^RAW|/�l||N||||^^device||20230626141745|UF-5000
42
3R|62|^^^YLC^A^1^S^  0004^01|0.1^MAINFORMAT|/�l||N||||^^device||20230626141745|UF-5000
48
4R|63|^^^SPERM^A^1^S^  0004^01|0.0^RAW|/�l||N||||^^device||20230626141745|UF-5000
E4
5R|64|^^^SPERM^A^1^S^  0004^01|0.0^MAINFORMAT|/�l||N||||^^device||20230626141745|UF-5000
EA
6R|65|^^^MUCUS^A^1^S^  0004^01|0.00^RAW|/�l||N||||^^device||20230626141745|UF-5000
1E
7R|66|^^^MUCUS^A^1^S^  0004^01|0.00^MAINFORMAT|/�l||N||||^^device||20230626141745|UF-5000
24
0R|67|^^^WBC^A^1^S^  0004^01|0.2^RAW|/�l||N||||^^device||20230626141745|UF-5000
3B
1R|68|^^^WBC^A^1^S^  0004^01|0.2^MAINFORMAT|/�l||N||||^^device||20230626141745|UF-5000
41
2R|69|^^^WBC Clumps^A^1^S^  0004^01|0.0^RAW|/�l||N||||^^device||20230626141745|UF-5000
D1
3R|70|^^^WBC Clumps^A^1^S^  0004^01|0.0^MAINFORMAT|/�l||N||||^^device||20230626141745|UF-5000
CE
4R|71|^^^RBC-Info.^A^1^S^  0004^01|0^RAW|||||||^^device||20230626141745|UF-5000
1E
5R|72|^^^RBC-Info.^A^1^S^  0004^01|0^MAINFORMAT|||||||^^device||20230626141745|UF-5000
24
6R|73|^^^UTI-Info.^A^1^S^  0004^01|0^RAW|||||||^^device||20230626141745|UF-5000
3D
7R|74|^^^UTI-Info.^A^1^S^  0004^01|0^MAINFORMAT|||||||^^device||20230626141745|UF-5000
43
0R|75|^^^BACT-Info.^A^1^S^  0004^01|0^RAW|||||||^^device||20230626141745|UF-5000
61
1R|76|^^^BACT-Info.^A^1^S^  0004^01|0^MAINFORMAT|||||||^^device||20230626141745|UF-5000
67
2R|77|^^^SF_DSS_PxSF_FSC_P^A^1^IF^  0004^01|20230626&R&PNG&E&R&E&[UF-5000&S&14894]&E&[20230626_141745]&E&R&E&[        ERR01000000001]_[SF_DSS_PxSF_FSC_P].png^RAW|||||||^^device||20230626141745|UF-5000
26
3R|78|^^^HIST_SF_FSC_P^A^1^IF^  0004^01|20230626&R&PNG&E&R&E&[UF-5000&S&14894]&E&[20230626_141745]&E&R&E&[        ERR01000000001]_[HIST_SF_FSC_P].png^RAW|||||||^^device||20230626141745|UF-5000
44
4R|79|^^^CW_SSH_AxCW_FSC_W^A^1^IF^  0004^01|20230626&R&PNG&E&R&E&[UF-5000&S&14894]&E&[20230626_141745]&E&R&E&[        ERR01000000001]_[CW_SSH_AxCW_FSC_W].png^RAW|||||||^^device||20230626141745|UF-5000
26
5R|80|^^^CW_FLL_AxCW_FSC_W^A^1^IF^  0004^01|20230626&R&PNG&E&R&E&[UF-5000&S&14894]&E&[20230626_141745]&E&R&E&[        ERR01000000001]_[CW_FLL_AxCW_FSC_W].png^RAW|||||||^^device||20230626141745|UF-5000
FF
6R|81|^^^CB_FLH_PxCB_FSC_P^A^1^IF^  0004^01|20230626&R&PNG&E&R&E&[UF-5000&S&14894]&E&[20230626_141745]&E&R&E&[        ERR01000000001]_[CB_FLH_PxCB_FSC_P].png^RAW|||||||^^device||20230626141745|UF-5000
B5
7R|82|^^^SF_FLL_WxSF_FLL_A^A^1^IF^  0004^01|20230626&R&PNG&E&R&E&[UF-5000&S&14894]&E&[20230626_141745]&E&R&E&[        ERR01000000001]_[SF_FLL_WxSF_FLL_A].png^RAW|||||||^^device||20230626141745|UF-5000
03
0R|83|^^^CW_FLH_PxCW_FSC_P^A^1^IF^  0004^01|20230626&R&PNG&E&R&E&[UF-5000&S&14894]&E&[20230626_141745]&E&R&E&[        ERR01000000001]_[CW_FLH_PxCW_FSC_P].png^RAW|||||||^^device||20230626141745|UF-5000
05
1R|84|^^^CW_SSH_PxCW_FLL_P^A^1^IF^  0004^01|20230626&R&PNG&E&R&E&[UF-5000&S&14894]&E&[20230626_141745]&E&R&E&[        ERR01000000001]_[CW_SSH_PxCW_FLL_P].png^RAW|||||||^^device||20230626141745|UF-5000
33
2R|85|^^^HIST_CW_SSH_P^A^1^IF^  0004^01|20230626&R&PNG&E&R&E&[UF-5000&S&14894]&E&[20230626_141745]&E&R&E&[        ERR01000000001]_[HIST_CW_SSH_P].png^RAW|||||||^^device||20230626141745|UF-5000
67
3L|1|N
06
`;

let testOrderDownload = `H|\\^&|||Host1||||||||LIS2-A2${CR}
P|1||P00001||Sample^Ichiro^^\\Sample^Ichiro^^^||19701130|M||||||ANEG||||KIDNEY1||||||IP${CR}
C|1||P^Patient Comment${CR}
O|1|20150730001||^^^RBC\\^^^WBC\\^^^WBC Clumps\\^^^EC\\^^^Squa.EC\\^^^Non SEC\\^^^CAST\\^^^Hy.CAST\\^^^Path.CAST\\^^^BACT\\^^^X'TAL\\^^^YLC\\^^^SPERM\\^^^MUCUS\\|A||20150730073000||||N||||Urine-EarlyMorning|D00001^Physician^Taro^^^Dr.|01-123-4567|O2015073000000001|||||||O||W00001^ East1FWard^04-5678-0123|||C00001^Urology${CR}
C|1||S^ Sample Comment${CR}
L|1|N${CR}`;