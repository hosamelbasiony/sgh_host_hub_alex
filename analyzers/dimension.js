const net = require('net');
const moment = require('moment');
const path = require('path');
const colors = require("colors");
const astm = require('./astm/utils');
const fileSystem = require("fs");

const { saveResult, reqCodes } = require('./db');

let device = {
    _id: '14',
    id: 14,
    name: 'DIMENSION',
    codes: []
};


let sgh;
let connection;

const PORT = 2245;

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
    let ret = d.getFullYear();
    ret += (d.getMonth() + 1 + '').length == 2 ? d.getMonth() + 1 + '' : '0' + (d.getMonth() + 1) + ''
    ret += (d.getDate() + '').length == 2 ? d.getDate() + '' : '0' + d.getDate() + ''

    if (extended) ret += (d.getHours() + '').length == 2 ? d.getHours() + '' : '0' + d.getHours() + ''
    if (extended) ret += (d.getMinutes() + '').length == 2 ? d.getMinutes() + '' : '0' + d.getMinutes() + ''
    if (extended) ret += (d.getSeconds() + '').length == 2 ? d.getSeconds() + '' : '0' + d.getSeconds() + ''

    return ret;
};

const requestMessage = async (lab_id, socket) => { };

const server = net.createServer((socket) => {
    socket.setEncoding();

    console.log('Dimension client connected to port ' + PORT);

    let message = new Message(socket);

    socket.on('error', err => console.log(`Socket error`, err.stack));

    let buffer = "";
    
    socket.on('data', data => {
        data = data.toString();
        console.log(data);

        fileSystem.appendFile('./log/dimension_in.txt', data + "\n\n", err => { });
        
        buffer += data;
        if ( buffer.indexOf(ACK) >= 0 ) buffer = "";
        if ( buffer.indexOf(ETX) >= 0 ) {
            buffer = buffer.substring(buffer.indexOf(STX));
            message.parse(buffer);

            buffer = "";
        }
    });
});

// Declaration
class Message {
    // First Poll -          <STX>P<FS>92300<FS>1<FS>1<FS>0<FS>6C<ETX>
    // Conversational Poll - <STX>P<FS>92300<FS>0<FS>1<FS>0<FS>6B<ETX>

    ID = "";
    type = "";
    deviceReady = false;
    noRequest = `${STX}N${FS}6A${ETX}`;
    request = "";
    poll = ""
    sid = ""
    lines = [];

    constructor(socket) {
        this.socket = socket;
    }

    async delay(msg) {
        setTimeout(() => {
            // no request
            this.socket.write(msg);
        }, 500);
    }

    async generateRequest({codes, patientName, patientId }) {

        let sampleType = "1"; // serum

        let template = `${STX}D${FS}0${FS}0${FS}A${FS}${patientName.split(" ").join(",").substring(0, 27)}`;
        template += `${FS}${this.sid}${FS}${sampleType}${FS}${FS}0${FS}1${FS}**${FS}1`;
        template += `${FS}${codes.length}`;
        for (let code of codes) template += `${FS}${code}`;
        template += `${FS}`;
        template += astm.checksum(template) + ETX;

        if (this.deviceReady) this.delay(template);
    }

    async parse(frame) {
        console.log("PARSING MESSAGE ...");

        let parts = frame.split(FS);
        this.type = parts[0].replace(STX, "");

        console.log("TYPE:", this.type);

        this.socket.write(ACK);

        if (this.type == "I") {
            // <STX>I<FS>043092011<FS>45<ETX>
            this.sid = parts[1];
            let ret = await reqCodes(device, this.sid);
            // { codes, patientId, patientName };
            
            console.log(JSON.stringify(ret, null, 4))
            this.generateRequest(ret);
            // this.generateRequest(ret.codes);

        } else if (this.type == "R") {
            // <STX>R<FS>0<FS>279-38-000<FS>sid043092005<FS>sample type 1<FS><FS>0<FS>ssmmhhddmmyy<FS>1
            // <FS>1 dilution<FS>2 tests
            // <FS>GLUC<FS>85.00<FS>mg/dL<FS>#
            // <FS>BUN <FS>7    <FS>mg/dL<FS>
            // 0C</ETX>

            // <STX>R<FS>0<FS><FS>1596<FS>1<FS><FS>0<FS>420111230702<FS>1
            // <FS>1<FS>5<FS>NA<FS><FS><FS>11<FS>K<FS><FS><FS>11<FS>CL<FS>
            // <FS><FS>11<FS>EC02
            // <FS><FS><FS>11<FS>CRE2<FS>0.2<FS>mg/dL<FS>3<FS>CB<ETX></ETX>

            let numberOfTests = Number(parts[10]);
            this.sid = parts[3];
            this.lines = [];

            console.log("numberOfTests", numberOfTests)

            for ( let i=0; i<numberOfTests; i+= 4 ) {
                this.lines.push({
                    hostcode: parts[11 + i],
                    code: parts[11 + i],
                    result: parts[12 + i]
                });
            }

            console.log(JSON.stringify(this.lines, null, 3));

            let result = {
                sid: this.sid,
                sampleid: this.sid,
                devicename: device.name,
                deviceid: device.id,
                lines: this.lines
            };
            
            saveResult(device, result);
            
        } else if (this.type == "P") {
            this.deviceReady = parts[3] == 1;
            this.ID = parts[1];
            if (this.poll == "") {
                this.poll = `${STX}P${FS}${this.ID}${FS}0${FS}1${FS}`;
                this.poll += astm.checksum(this.poll) + ETX
            }

            if (this.deviceReady) {
                // no request
                this.delay(this.noRequest);
            } else {
                // TODO: revise
                // this.delay(this.poll);
            }
        }
        return "";
    }
}

exports.start = (io, conn, sghConn) => {

    connection = conn;
    sgh = sghConn;

    server.listen(PORT, () => {
        // let initialPoll = `${STX}P${FS}9300${FS}1${FS}1${FS}0${FS}6C${ETX}`;
        // let initialPoll = `${STX}P${FS}92300${FS}1${FS}1${FS}0${FS}`;
        // let initialPoll = `${STX}P${FS}92300${FS}0${FS}1${FS}0${FS}`;
        
        // initialPoll += astm.checksum(initialPoll) + ETX;
        // fileSystem.appendFile('./log/dimension_in.txt', initialPoll, err => { });

        console.log(`\nDimension host tcp server listening on ${PORT} `.bgBrightYellow);

        test();        
    });
};

let test = () => {

    let testSample = `${STX}R${FS}0${FS}${FS}715037${FS}1${FS}${FS}0${FS}594513230702${FS}1${FS}1${FS}1${FS}CKI${FS}2590${FS}U/L${FS}3${FS}AE${ETX}`;
    // testSample = `${STX}R${FS}0${FS}${FS}1596${FS}1${FS}${FS}0${FS}420111230702${FS}1${FS}1${FS}5${FS}NA${FS}${FS}${FS}11${FS}K${FS}${FS}${FS}11${FS}CL${FS}${FS}${FS}11${FS}EC02${FS}${FS}${FS}11${FS}CRE2${FS}0.2${FS}mg/dL${FS}3${FS}CB${ETX}`;
    //R0151910594513230702111CKI2590U/L3AE
    // fileSystem.appendFile('./log/dimension_test.txt', testSample + "\n\n", err => { });

    let sampleOrder = `${STX}I${FS}715037${FS}45${ETX}`;

    let messages = [
        `${STX}P${FS}92300${FS}1${FS}1${FS}0${FS}6C${ETX}`,
        testSample,
        // sampleOrder
    ];
    
    var client = net.connect({port: PORT}, () => client.write(messages.shift()));

    client.on("data", data => {
        console.log(data.toString())
        fileSystem.appendFile('./log/dimension_client_test.txt', data.toString() + "\n\n", err => { });

        if( data.toString().indexOf(ETX) > -1 ) client.write(ACK);

        setTimeout(() => {
            if ( messages.length ) client.write(messages.shift());
        }, 1000);
    });
}