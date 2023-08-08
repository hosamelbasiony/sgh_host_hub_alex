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
// const database          = require ('./mssql');


let inDir = path.resolve(process.cwd(), 'log', 'e411_in.txt');
let resDir = path.resolve(process.cwd(), 'log', 'e411_out.txt'); 

let device = {
    _id: '4',
    id: 4,
    name: 'Archi',
    codes: []
};

// Device.findOne({ name: 'Archi' }).exec ( (err, _device) => {
//     if ( !err ) device = _device;
// });

// setInterval ( () => {
// 	Device.findOne({ name: 'Archi' }).exec ( (err, _device) => {
//     	if ( !err ) device = _device;
// 	});
// }, 30000);

let sgh;
let connection;

const PORT = 2231;

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
    d.setHours(d.getHours() - 2);
	
	let ret = d.getFullYear();
    ret += (d.getMonth()+1+'').length == 2 ? d.getMonth()+1+'' : '0' + (d.getMonth()+1)+''
    ret += (d.getDate()+'').length == 2 ? d.getDate()+'' : '0' + d.getDate()+''
    
    if ( extended ) ret += (d.getHours()+'').length == 2 ? d.getHours()+'' : '0' + d.getHours()+''
    if ( extended ) ret += (d.getMinutes()+'').length == 2 ? d.getMinutes()+'' : '0' + d.getMinutes()+''
    if ( extended ) ret += (d.getSeconds()+'').length == 2 ? d.getSeconds()+'' : '0' + d.getSeconds()+''

    return ret;
};

const dateString2 = (hours = true, minutes = true, seconds = true) => {
    let d = new Date();
    let ret = d.getFullYear();
    ret += (d.getMonth()+1+'').length == 2 ? d.getMonth()+1+'' : '0' + (d.getMonth()+1)+''
    ret += (d.getDate()+'').length == 2 ? d.getDate()+'' : '0' + d.getDate()+''
    
    if ( hours ) ret += (d.getHours()+'').length == 2 ? d.getHours()+'' : '0' + d.getHours()+''
    if ( minutes ) ret += (d.getMinutes()+'').length == 2 ? d.getMinutes()+'' : '0' + d.getMinutes()+''
    if ( seconds ) ret += (d.getSeconds()+'').length == 2 ? d.getSeconds()+'' : '0' + d.getSeconds()+''

    return ret;
};

const requestMessage = async ( lab_id, socket, orderType = 'Q' ) => {
    
    try {
        
        // let SidParams = lab_id_.split("^");
        // let lab_id = SidParams[2];
        // let POS = SidParams[3] + "^" + SidParams[4] + "^" + SidParams[5] + "^^" + SidParams[7] + "^" + SidParams[8];


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

        let record = `${STX}1H|\\^&||||||||||P|1${CR}${ETX}`;
        record = record + astm.checksum(record) + `${CR}${LF}`;
        msgtosend = [...msgtosend, record];

        // record    = `${STX}2P|1||${LabNumber}||Doe^Jane^Q||19800122|F|||||Dr. Al-Basiony||||||||||||SGH${CR}${ETX}`;
        record    = `${STX}2P|1||${LabPID}||${pName}||${DOB}|${PatientGender}|||||Dr. Al-Basiony||||||||||||SGH${CR}${ETX}`;
        record = record + astm.checksum(record) + `${CR}${LF}`;
        msgtosend = [...msgtosend, record];

        // record    = `${STX}3O|1|${LabNumber}||^^^2839\\^^^2002\\^^^1096|||${dateString()}||||A|Hep|lipemic||serum||||||||||${orderType}${CR}${ETX}`;
        record    = `${STX}3O|1|${LabNumber}||${TestRequest}|||${dateString()}||||A||||serum||||||||||${orderType}${CR}${ETX}`;
        record = record + astm.checksum(record) + `${CR}${LF}`;
        msgtosend = [...msgtosend, record];
        
        record    = `${STX}4L|1|${CR}${ETX}`;
        record = record + astm.checksum(record) + `${CR}${LF}`;
        msgtosend = [...msgtosend, record];

        msgtosend.reverse();
        
        fileSystem.appendFile('./data/archi_out.txt', msgtosend[0].toString(), err => {});  

        if ( socket ) socket.write(ENQ);

    } catch(ex) {
        console.log(ex.stack);
    }
};

const requestInfo = async ( lab_id, socket ) => {
    
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

    record    = `${STX}2P|1${CR}${ETX}`;
    record = record + astm.checksum(record) + `${CR}${LF}`;
    msgtosend = [...msgtosend, record];

    record    = `${STX}3Q|1|^${LabNumber}||^^^ALL||||||||X${CR}${ETX}`;
    record = record + astm.checksum(record) + `${CR}${LF}`;
    msgtosend = [...msgtosend, record];
    
    record    = `${STX}4L|1|${CR}${ETX}`;
    record = record + astm.checksum(record) + `${CR}${LF}`;
    msgtosend = [...msgtosend, record];

    msgtosend.reverse();
    
    // console.log(msgtosend[0]); 
    fileSystem.appendFile('./data/archi_out.txt', msgtosend[0].toString(), err => {});  

    if ( socket ) socket.write(ENQ);
};

const server = net.createServer( (socket) => {
    socket.setEncoding();

    console.log('Archi client connected to port ' + PORT);

    socket.on ( 'error', err => console.log(`${moment(new Date()).format("YYYY-MM-DD hh:mm:ss")} Archi: Socket error`, err.stack) );


    let reader = new AstmSocketReader(socket, inDir);
    let parser = new AstmSocketParser(socket, device, connection, sgh);

    // console.log('parser set to value')

    reader.on ( 'data', data => {
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
            fileSystem.appendFile('./data/archi_out.txt', msg.toString(), err => {});  
            // reader.write(msg);
        } else {
            // reader.write(EOT);
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


    // requestInfo('91237', socket, 'O');

});

const saveResult = async result  => {

	// if( Math.random() > 0.5 ) return;

    try {

        //console.log('saveResult', result);

        io.emit("e411_result", { data: result });

        // sgh.upload(result, device.id);

        console.log(JSON.stringify(result, undefined, 2));
        // return;

        let resultList = result;
        let deviceId = device.id;

        let userId = 10137; // req.params.userId;
        
        let LabNumber = resultList.sampleid;

        for ( let line of resultList.lines ) {

            let query  = `select * from IPOP_LABORDERS where LabNumber = ${LabNumber} and ParameterID = ${line.parameterId}`;
            let results = await sgh.query(query, { type: Sequelize.QueryTypes.SELECT});

            console.log(query);

            let Status = 0; // from tarqeem
            let UserID = userId; // from tarqeem
            let EquipmentID = 26; //deviceId; // from tarqeem added manually    

            line.unit = line.unit || '';

            if ( results.length ) {

                let PatientType = results[0].PatientType;
                let OrderID = results[0].OrderID;
                let TestID = results[0].TestID;


                let query  = `select * from Lab_Results where OrderID = ${OrderID} 
                            and LabNumber = ${LabNumber} and ParameterID = ${line.parameterId} and TestID = ${TestID}`;
                let results2 = await sgh.query(query, { type: Sequelize.QueryTypes.SELECT});

                console.log(query);

                if ( !results2.length || 1 ) {
                    
                    let query  = `insert into Lab_Results 
                    (OrderID, LabNumber, ParameterID, TestID, Result, EquipmentID, UserID, Status, PatientType, UnitName) 
                    values ('${OrderID}', '${LabNumber}', '${line.parameterId}', 
                    '${TestID}', '${line.result}', '${EquipmentID}', '${UserID}', 
                    '${Status}', '${PatientType}', '${line.unit}')`;

                    console.log(query);

                    await sgh.query(query, { type: Sequelize.QueryTypes.INSERT});
                }             
            } 

        }
    } catch(ex) {
        console.log(ex.stack);
    }
    
};

exports.start = (io, conn, sghConn) => {

    connection = conn;
    sgh = sghConn;

    server.listen(PORT, () => {
        console.log(`\nArchi host tcp server listening on ${PORT} `.bgRed);
        
        // test(conn, sgh);
    }); 
};

const test = (connection, sgh) => {

    let parser = new AstmSocketParser({}, device, connection, sgh);
    parser.on( 'results', results => saveResult(results) );
    parser.on( 'requisition', sid => {
        console.log(sid+ " to request");
        // toRequesition = [...toRequesition, sid]
        requestMessage ( sid , null, connection, sgh );
    });
    
    ////////////////////////////////////////////////////////////////////////////////////////////////
    // test data ///////////////////////////////////////////////////////////////////////////////////
    let data = `H|\^&|||ASI^1.0^s/n^H1P1O1R1Q1L1C1|||||My^Host^System||P|1|19930631${CR}`;
    data += `O|1|715037||^^^10^Test10^protocol1|S|19930631|19930629||||||||SERUM|Miller^John^^^Dr|||||||||O|${CR}`;
    data += `R|1|^^^10^Test10^protocol1^^P|500.56|RATE|||F||OPERATOR12^SUPER12|| 199306310930|MANUALLY ENTERED${CR}`
    data += `R|2|^^^10^Test10^protocol1^^F|56.33|ng/ml|25 to 60^normal||F||OPERATOR12 ^SUPER12|| 199306310930|${CR}`
    data += `L|1|N${CR}`;

    data = `H|\^&|||ASI^1.0^s/n^H1P1O1R1Q1L1C1|||||My^Host^System||P|1|19930631${CR}`;
    // data += `Q|1|PID1234^ALL||^^^ALL||||||||F${CR}`;
    data += `Q|1|^715037||^^^ALL||||||||O${CR}`;
    data += `L|1|N${CR}`;

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

// server.listen(PORT, () => {
//     console.log(`Archi host tcp server listening on ${PORT} `.green);
// });