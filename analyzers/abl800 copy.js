const net               = require('net');
const moment            = require('moment');
const path              = require('path');
const colors            = require("colors");
const astm              = require('./astm/utils');
const fileSystem        = require("fs");
const Sequelize         = require('sequelize');
const { Op }            = require('sequelize');

const AstmSocketReader  = require('./astm/reader');
const AstmSocketParser  = require('./astm/parser');
// const Device            = require('../models/device');
const config      = require('../config');

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


let toRequesition = [];
let msgtosend = [];

const dateString = (extended = true) => {
    let d = new Date();
    let ret = d.getFullYear();
    ret += (d.getMonth()+1+'').length == 2 ? d.getMonth()+1+'' : '0' + (d.getMonth()+1)+''
    ret += (d.getDate()+'').length == 2 ? d.getDate()+'' : '0' + d.getDate()+''
    
    if ( extended ) ret += (d.getHours()+'').length == 2 ? d.getHours()+'' : '0' + d.getHours()+''
    if ( extended ) ret += (d.getMinutes()+'').length == 2 ? d.getMinutes()+'' : '0' + d.getMinutes()+''
    if ( extended ) ret += (d.getSeconds()+'').length == 2 ? d.getSeconds()+'' : '0' + d.getSeconds()+''

    return ret;
};

const requestMessage = async ( lab_id, socket, orderType = 'Q' ) => {
    
    try {
        
       
        ///////////////////////////////////////////////////////////////////////////////////////
        /////// DB Requisition ////////////////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////////////////////////
        let LabNumber = lab_id.toString().replace(/^0+/, '');
        LabNumber = LabNumber.replace(/^0+/, '');
        LabNumber = LabNumber.replace(/@/, '');
        
        const analyzerParamList = await connection.models.deviceCode.findAll({
            where: {
                download: true,
                deviceId: device.id,
            }
        });    

        // console.log(analyzerParamList);

        let inStatement = [0, ...analyzerParamList.map( x => x.paramId+'' )].join(',');

        console.log(inStatement);

        let sql = `SELECT * FROM IPOP_LABORDERS 
        WHERE LabNumber = ${LabNumber} AND ParameterID IN (${inStatement})`;

        console.log(sql);
        // return;

        const results = await sgh.query(sql, { type: Sequelize.QueryTypes.SELECT});
                
        let ret = [];
        let patientName = '';
        let patientId = '';
        let gender = '';
        let DOB = '19800122';
        // var now = moment("2016-03-08 16:33:12.000").format('YYYYMMDD');
        // alert(now);
        
        if ( results.length ) {
            patientName = results[0].PatientName;
            gender = results[0].Gendar;
            patientId = results[0].PatientId;
            DOB = moment(results[0].DOB).format('YYYYMMDD')
        
            let paramIdList = results.map ( x => x.ParameterId );    
        
            let codesToSend =  analyzerParamList.filter ( x => x.download && paramIdList.includes(parseInt(x.paramId)) );
        
            for ( let param of codesToSend )  if ( ret.indexOf(param.hostCode ) == -1 ) ret = [...ret, param.hostCode];     

        }

        ret = { codes: ret, patientId, patientName };
        ///////////////////////////////////////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////////////////////////
        
        // console.log(JSON.stringify(ret,undefined,4));

        let codes = ret.codes;
        let [name1, name2, name3] = ret.patientName.split(' '); 

        let pName = ret.patientName.split(" ").slice(0, 3).join("^");

        let LabPID =  ret.patientId;
        
        let PatientDOB =  '19780727';
        let PatientGender =  gender == 'Male'? 'M':'F';
        let Referral =  '';
        let Location =  'SGHC01';

        // let TestRequest = codes.map(x => '^^^'+x).join('^\\') + '^';
        let TestRequest = codes.map(x => '^^^'+x).join('\\') ;
        // ^^^10^Test10^protocol1
        
        msgtosend = [];


        let record = `${STX}1H|\\^&|||tarqeem^^^^|||||CA-600${CR}${ETX}`;
        record = record + astm.checksum(record) + `${CR}${LF}`;
        msgtosend = [...msgtosend, record];

        record = `${STX}2P|1${CR}${ETX}`;
        record = record + astm.checksum(record) + `${CR}${LF}`;
        msgtosend = [...msgtosend, record];
        
        record    += `${STX}3O|1|000001^01^1^B||^^^040^^100\^^^050^^100|R|${dateString()}|||||N${CR}${ETX}`;
        record = record + astm.checksum(record) + `${CR}${LF}`;
        msgtosend = [...msgtosend, record];

        record = `${STX}4L|1|N${CR}${ETX}`;
        record = record + astm.checksum(record) + `${CR}${LF}`;
        msgtosend = [...msgtosend, record];
        
        msgtosend.reverse();
        
        fileSystem.appendFile('./data/abl800_out.txt', msgtosend[0].toString(), err => {});  

        if ( socket ) socket.write(ENQ);

    } catch(ex) {
        console.log(ex.stack);
    }
};

const server = net.createServer( (socket) => {
    socket.setEncoding();

    console.log('ABL800 client connected to port ' + PORT);

    socket.on ( 'error', err => console.log(`Socket error`, err.stack) );


    // socket.write(ACK);

    let reader = new AstmSocketReader(socket, inDir);
    let parser = new AstmSocketParser(socket, device, connection, sgh);

    reader.on ( 'data', data => {

        // fileSystem.appendFile('./data/abl800.txt', JSON.stringify(data), err => {});  

        // console.log(data);
        toRequesition = [];
        parser.parse(data, device);
    });
    reader.on ( 'enquired', _ => msgtosend = [] );
    reader.on ( 'negativeacknowledged', _ => msgtosend = [] );
    reader.on ( 'acknowledged', _ => { 
        if ( msgtosend.length ) {
            let msg = msgtosend.pop();
            console.dir(`sending: ${msg}`.yellow);
            socket.write(msg);
            fileSystem.appendFile('./data/abl800_out.txt', msg.toString(), err => console.error(err));  

        } else {

            socket.write(EOT);
            console.log('EOT'.yellow); 
            
            if ( toRequesition.length ) {
                let sid = toRequesition.pop();
                
                
                
                requestMessage(sid, socket);
            }
        }
    });

    parser.on( 'requisition', sid => {
        console.log(sid+ " to request");
        toRequesition = [...toRequesition, sid]
    });
    parser.on( 'results', results => saveResult(results) );
    parser.on( 'startDownload', _ => {
        console.log('startDownload' + JSON.stringify(toRequesition, undefined, 4));
        if ( toRequesition.length ) {
            let sid = toRequesition.pop();
            requestMessage(sid, socket);
        }
    });

});

const saveResult = async result => {

    // if( Math.random() > 0.5 ) return;

    try {

        console.log(JSON.stringify(result, undefined, 2));

        if (new Date() != null) return;

        let resultList = result;
        let deviceId = device.id;

        let userId = config.userId; //10137; // req.params.userId;

        let LabNumber = resultList.sampleid;

        for (let line of resultList.lines) {

            let query = `select * from IPOP_LABORDERS where LabNumber = ${LabNumber} and ParameterID = ${line.parameterId}`;
            let results = await sgh.query(query, { type: Sequelize.QueryTypes.SELECT });

            console.log(query);

            let Status = 0; // from tarqeem
            let UserID = userId; // from tarqeem
            let EquipmentID = 26; //deviceId; // from tarqeem added manually    

            line.unit = line.unit || '';

            if (results.length) {

                let PatientType = results[0].PatientType;
                let OrderID = results[0].OrderID;
                let TestID = results[0].TestID;


                let query = `select * from Lab_Results where OrderID = ${OrderID} 
                            and LabNumber = ${LabNumber} and ParameterID = ${line.parameterId} and TestID = ${TestID}`;
                let results2 = await sgh.query(query, { type: Sequelize.QueryTypes.SELECT });

                console.log(query);

                if (!results2.length || 1) {

                    let query = `insert into Lab_Results 
                    (OrderID, LabNumber, ParameterID, TestID, Result, EquipmentID, UserID, Status, PatientType, UnitName) 
                    values ('${OrderID}', '${LabNumber}', '${line.parameterId}', 
                    '${TestID}', '${line.result}', '${EquipmentID}', '${UserID}', 
                    '${Status}', '${PatientType}', '${line.unit}')`;

                    console.log(query);

                    await sgh.query(query, { type: Sequelize.QueryTypes.INSERT });
                }
            }

        }
    } catch (ex) {
        console.log(ex.stack);
    }

};

exports.start = (io, conn, sghConn) => {

    connection = conn;
    sgh = sghConn;

    server.listen(PORT, () => {
        console.log(`\nABL800 host tcp server listening on ${PORT} `.bgBrightCyan);
    }); 
};