const net = require('net');
const EventEmitter = require('events');
const fileSystem = require("fs");
const path = require('path');

const mssql = require('../mssql');

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

let myBuffer = "";

class AstmSocketParser extends EventEmitter {

    constructor(socket, device, connection, sgh) {
        super();
        this.socket = socket;
        this.device = device;
        this.connection = connection;
        this.sgh = sgh;
    }

    write(data) {
        this.socket.write(data);
    }

    async parse(msg, device) {

        console.log(('parsing: ' + msg).cyan);

        let msgTypeIsQuery = false;

        let result = {
            sid: '',
            sampleid: "",
            devicename: this.device.name,
            deviceid: this.device.id,
            lines: []
        };

        let astmLines = msg.split(CR);
        if (device.name == 'CA-600') {
            //astmLines = msg.match(/\d.\|.*\|/g);
            //console.log(JSON.stringify(astmLines, undefined, 2));
        }

        // if ( device.name == 'CA-600' ) astmLines = msg.split('\n');	

        // console.log(JSON.stringify(astmLines, undefined, 2));
        // return;

        if (astmLines) {

            for (let line of astmLines) {

                console.log(line);

                let fields = line.split("|");

                if (fields.length) {

                    let lineType = fields[0];

                    // console.error(lineType);

                    if (lineType.includes("Q")) {
                        //if ( lineType.match(/^\dQ\|/g) ) {

                        //prepare order
                        msgTypeIsQuery = true;
                        let SID_ = false;

                        let rackNo = '';
                        let tubePosition = '';
                        let sampleIdAttr = '';

                        try {
                            SID_ = line.split("|")[2].replace('^', '').trim();
                            if (device.name == 'CA-600') {
                                rackNo = line.split("|")[2].split('^')[0];
                                tubePosition = line.split("|")[2].split('^')[1];
                                SID_ = line.split("|")[2].split('^')[2];
                                sampleIdAttr = line.split("|")[2].split('^')[3];
                            }
                            //sid = line.split("|")[2].split("^")[1];
                        } catch (ex) {
                            //console.error(ex);
                        }

                        // if ( SID_ ) console.log(SID_);

                        if (SID_) {
                            if (device.name == 'CA-600') this.emit("requisition", { sid: SID_, rackNo, tubePosition, sampleIdAttr });
                            // else if ( device.name == 'Stago' ) this.emit("requisition", { sid: SID_, rackNo, tubePosition, sampleIdAttr });
                            else this.emit("requisition", SID_);
                        }

                        // } else if ( lineType.match(/^\dP\|/g) ) {
                    } else if (lineType.includes("P")) {

                        let sid = false;

                        if (this.device.name == 'ABL') sid = line.split("|")[3];

                        if (sid) {
                            result = {
                                sid: sid,
                                sampleid: sid,
                                devicename: this.device.name,
                                deviceid: this.device.id,
                                lines: []
                            };
                        }

                    } else if (lineType.includes("O")) {
                        //} else if ( lineType.match(/^\dO\|/g) ) {

                        console.log("order line: ", line);
                        console.log("device: ", this.device.name);

                        //if result obj populated => save                

                        let sid = false;

                        try {
                            if (this.device.name == 'Ruby') sid = line.split("|")[2].split('^')[0];
                            else if (this.device.name == 'CA-600') sid = line.split("|")[3].split('^')[2].trim();
                            // else if ( this.device.name == 'ABL' ) sid = line.split("|")[3].split('^')[1];
                            else if (this.device.name == 'Gem') sid = line.split("|")[3];
                            // else if ( this.device.name == 'Stago' ) sid = line.split("|")[3].split('^')[2];
                            else sid = line.split("|")[2].replace('^', '').trim();
                        } catch (ex) {
                            console.log(JSON.stringify(ex, undefined, 2));
                        }

                        // if ( result.lines.length && result.sampleid != sid ) saveResult( JSON.parse(JSON.stringify(result)) ).then ( res => console.log(res) );

                        if (sid) {
                            result = {
                                sid: sid,
                                sampleid: sid,
                                devicename: this.device.name,
                                deviceid: this.device.id,
                                lines: []
                            };
                        }

                    } else if (lineType.includes("R")) {
                        // } else if ( lineType.match(/^\dR\|/g) ) {

                        let code = 0;

                        if (this.device.name == 'Ruby') code = line.split("|")[2].split('^')[6];
                        else if (this.device.name == 'CA-600') code = line.split("|")[2].split('^')[3];
                        else if (this.device.name == 'Gem') code = line.split("|")[2].split('^')[3];
                        else if (this.device.name == 'ABL') code = line.split("|")[2].split('^')[3];
                        else if (this.device.name == 'Stago') code = line.split("|")[2].split('^')[3];
                        else code = line.split("|")[2].split('^')[3].split('/')[0];

                        // console.log("code", code);

                        let type_ = '';
                        if (line.split("|")[2].split('^').length > 9) type_ = line.split("|")[2].split('^')[10];

                        let result_ = line.split("|")[3];
                        if (this.device.name == 'E411' && result_.indexOf(("^") > -1)) result_ = result_.split("^")[1];

                        // console.log(type_);

                        if (type_.trim() == 'F' || this.device.name != 'Archi') { // Final result only in Archi
                            const filteredCodes = await this.connection.models.deviceCode.findAll({
                                where: {
                                    upload: true,
                                    deviceId: this.device.id,
                                    hostCode: code
                                }
                            });

                            // console.log(code, this.device.id, filteredCodes)

                            // let filteredCodes = this.device.codes.filter( x => x.upload && x.code == code);
                            for (let filteredCode of filteredCodes) {
                                result.lines = [...result.lines, {
                                    code,
                                    result: result_,
                                    hostcode: code,
                                    parameterId: filteredCode.paramId,
                                    parameter_id: filteredCode.paramId,
                                    type_
                                }];
                            }

                            // console.log(result);
                        }

                        this.emit("results", result);

                    }

                }
            }
        }

        if (msgTypeIsQuery) this.emit("startDownload", {});
        else {

            // console.log(JSON.stringify(result, undefined, 2));

            // result.lines = await mssql.getFilteredParams( result.sid, result.lines );
            // console.log(JSON.stringify(result, undefined, 4));

            // if ( result.lines.length ) this.emit("results", result);
        }

    }
};

module.exports = AstmSocketParser;
