const net               = require('net');
const EventEmitter      = require('events');
const fileSystem        = require("fs");
const path              = require('path');

const mssql             = require ('../mssql');

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

let myBuffer = "";

class AstmSocketParser extends EventEmitter {

    constructor( socket, device, connection, sgh ) {
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

        console.log('parsing: ' + msg);

        let msgTypeIsQuery = false;
        
        let result = {
        	sid: '',
            sampleid: "",
            devicename: this.device.name,
            deviceid: this.device.id,
            lines: []
        };
    
        let astmLines = msg.match(/\d.\|.*\|/g);

        fileSystem.appendFile("./log/parser2.txt", JSON.stringify(astmLines, undefined, 2), err => {});

    	for ( let line of  astmLines) {
            console.log(line);
        }      
    
    }
};

module.exports = AstmSocketParser;
