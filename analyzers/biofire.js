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

let inDir = path.resolve(process.cwd(), 'log', 'C311_in.txt');
let resDir = path.resolve(process.cwd(), 'log', 'C311_out.txt'); 

//Biofire
let device = {
    _id: '1',
    id: 1,
    name: 'Biofire', 
    codes: []
};

let connection;

const PORT = 6601;

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

    console.log('Biofire client connected to port ' + PORT);

    socket.on ( 'error', err => console.log(`Socket error`, err.stack) );
    
    socket.on('data', data => {
        console.log(data);
        fileSystem.appendFile('log/Biofire_RAW.txt', data+"###", (err) => {});
		
    });

});

const save = result => {
    console.log(JSON.stringify(result, undefined, 3));
}

exports.start = (io, conn) => {

    connection = conn;

    server.listen(PORT, () => {
        console.log(`\nBiofire host tcp server listening on ${PORT} `.bgBlue);
    }); 
};