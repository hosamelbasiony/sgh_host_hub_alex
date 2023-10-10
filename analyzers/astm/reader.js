const net               = require('net');
const EventEmitter      = require('events');
const fileSystem        = require("fs");
const path              = require('path');

// let inDir = path.resolve(process.cwd(), 'log', 'e411_in.txt');
// let resDir = path.resolve(process.cwd(), 'log', 'e411_out.txt');

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

class AstmSocketReader extends EventEmitter {

    constructor( socket, inDir ) {
        super();
        this.socket = socket;
        this.inDir = inDir;
        // console.log( 'assigning handler' );
        this.socket.on('data', data => this.__handleData(data));
    }

    write(data) {
        this.socket.write(data);
    }

    __handleData(data) {
        try {

            data = data.toString();
            
            fileSystem.appendFile(this.inDir, data, err => {});   
            
            // console.log(data);

            for ( var x=0; x<data.length; x++) {
                
                let b = data[x];

                myBuffer += b;               

                if ( b == ACK ) {
                    console.log('ACK'.green);
                    this.emit('acknowledged', _ => {});

                } else if ( b == NAK ) {
                    console.log('NAK'.green);
                    this.emit('negativeacknowledged', _ => {});
                    this.socket.write(EOT);

                } else if ( b == ENQ ) {
                    this.socket.write(ACK);
                    console.log('ENQ'.green);
                    this.emit('enquired', _ => {});
                    myBuffer = "";

                } else if ( b == ETX ) {
                    this.socket.write(ACK);

                } else if ( b == STX ) {

                } else if ( b == ETB ) {
                    this.socket.write(ACK);

                } else if ( b == EOT ) {
                    console.log('EOT'.green);
                    let localBuffer = myBuffer + '';
                    myBuffer = "";

                    // get rid of STX and number: localBuffer.replace(/\x02[0-9]/g, '');
                    // further get rid of ETB - Checksum digits - CR - LF  and number: buffer.replace(/\x02[0-9]/g, '').replace(/\x17..\x0d\x0a/g, '');
                    // use to split app messages: .replace(/\x03..\x0d\x0a/g, ETX) //ETX
                    
                    localBuffer = localBuffer.replace(/\x02[0-9]/g, '').replace(/\x17..\x0d\x0a/g, '');
                    //localBuffer = localBuffer.replace(/\x03..\x0d\x0a/g, ETX);
                    localBuffer = localBuffer.replace(/\x03..\x0d\x0a/g, '');
					localBuffer = localBuffer.replace(/\x02./g, '');

                    let messages = localBuffer.split(EOT);

                    // console.log('evaluating');
                    
                    //for ( let msg of messages ) if ( msg.includes('|') ) parse(msg);
                    for ( let msg of messages ) if ( msg.includes('|') ) this.emit('data', msg);

                } else if ( b.toString().charCodeAt(0) > 31 || b == LF || b == CR ) {}
            }
        } catch(ex) {
        	console.error(ex);
        }
    }
};

module.exports = AstmSocketReader;
