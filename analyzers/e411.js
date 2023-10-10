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

const { saveResults, reqCodes }      = require('./db');

let inDir = path.resolve(process.cwd(), 'log', 'e411_in.txt');
let resDir = path.resolve(process.cwd(), 'log', 'e411_out.txt'); 

let device = {
    _id: '2',
    id: 2,
    name: 'E411',
    codes: []
};

const PORT = 2227;

let sgh;
let connection;

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
let myBuffer = "";

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

    let SidParams = lab_id.split("^");

	///////////////////////////////////////////////////////////////////////////////////////
    /////// WEIRD FIX /////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////
    SidParams = ["", ...SidParams];
    ///////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////
    

    lab_id = SidParams[2];
    let POS = SidParams[3] + "^" + SidParams[4] + "^" + SidParams[5] + "^^" + SidParams[7] + "^" + SidParams[8];

    try {
  
        ///////////////////////////////////////////////////////////////////////////////////////
        /////// DB Requisition ////////////////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////////////////////////
        let LabNumber = lab_id.toString().replace(/^0+/, '');
        LabNumber = LabNumber.replace(/^0+/, '');
        LabNumber = LabNumber.replace(/@/, '');
        
        // const analyzerParamList = await connection.models.deviceCode.findAll({
        //     where: {
        //         download: true,
        //         deviceId: device.id,
        //     }
        // });    

        
        // let inStatement = [0, ...analyzerParamList.map( x => x.paramId+'' )].join(',');

        // console.log(inStatement);

        // let sql = `SELECT * FROM IPOP_LABORDERS 
        // WHERE LabNumber = ${LabNumber} AND ParameterID IN (${inStatement})`;

        // console.log(sql);
        
        // const results = await sgh.query(sql, { type: Sequelize.QueryTypes.SELECT});
                
        // let ret = [];
        // let patientName = '';
        // let patientId = '';
        // let gender = '';
        // let DOB = '19800122';
            
        // if ( results.length ) {
        //     patientName = results[0].PatientName;
        //     gender = results[0].Gendar;
        //     patientId = results[0].PatientId;
        //     DOB = moment(results[0].DOB).format('YYYYMMDD')
        
        //     let paramIdList = results.map ( x => x.ParameterId );    
        
        //     let codesToSend =  analyzerParamList.filter ( x => x.download && paramIdList.includes(parseInt(x.paramId)) );
        
        //     for ( let param of codesToSend )  if ( ret.indexOf(param.hostCode ) == -1 ) ret = [...ret, param.hostCode];     

        // }

        // ret = { codes: ret, patientId, patientName };

        // let ret = await reqCodes(device, this.sid);
        let ret = { codes: ["10"], patientId: "123456", patientName: "HOSAM MOHAMMAD ALI", gender: "M", DOB: "1978-08-05" }

        ///////////////////////////////////////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////////////////////////
        let codes = ret.codes;
        //let patientNames = ret.patientName.split(' ');
        let [name1, name2, name3] = ret.patientName.split(' ');
    
    	let LabPID =  ret.patientId;
        
        let PatientDOB =  '19780727' // ret.DOB;
        let PatientGender = "M"; // ret.gender == "Male"? "M" : "F"; //F -- U
        let Referral =  '';
        let Location =  'SGHALEX';
        let TestRequest = codes.map(x => '^^^'+x).join('^\\') + '^';
        let CollectionDate = dateString(); //20010223081223
    
    	console.log("to download", TestRequest);
    	console.log("POS", POS);

        let PracticePID = ''; 

        msgtosend = [];

        let record = `${STX}1H|\\^&|||cobas-e411^1|||||host|TSDWN^REPLY|P|1${CR}`;
        record    += `P|1${CR}`;
        record    += `O|1|${lab_id}|${POS}|${TestRequest}|R||||||A||||1||||||||||O${CR}`;
        record    += `L|1|N${CR}${ETX}`;

        record = record + astm.checksum(record) + `${CR}${LF}`;
        msgtosend = [...msgtosend, record];

        msgtosend.reverse();
        
        //console.log(msgtosend[0]);
        fileSystem.appendFile(resDir, msgtosend[0].toString(), err => {});  

        socket.write(ENQ);
        ///////////////////////////////////////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////////////////////////

    } catch(ex) {
        console.log(ex.stack);
    }
};

const server = net.createServer( (socket) => {
    socket.setEncoding();
    
    console.log('E411 client connected to port ' + PORT);

    let reader = new AstmSocketReader(socket, inDir);
    let parser = new AstmSocketParser(socket, device, connection, sgh);

    reader.on ( 'data', data => {
    	//console.log(data);
        toRequesition = [];
        parser.parse(data, reader);
    });
    reader.on ( 'enquired', _ => msgtosend = [] );
    reader.on ( 'negativeacknowledged', _ => msgtosend = [] );
    reader.on ( 'acknowledged', _ => {
        if ( msgtosend.length ) {
            let msg = msgtosend.pop();
            console.dir(`sending: ${msg}`.yellow);
            reader.write(msg);
        } else {
            reader.write(EOT);
            console.log('EOT'.yellow); 
            
            if ( toRequesition.length ) {
                let sid = toRequesition.pop();
                requestMessage(sid, reader);
            }
        }
    });

    parser.on( 'requisition', sid => {
        console.log(sid+ " to request");
        toRequesition = [...toRequesition, sid]
    });
    parser.on( 'results', results => saveResults(device, results) );
    parser.on( 'startDownload', _ => {
        console.log('startDownload' + JSON.stringify(toRequesition, undefined, 4));
        if ( toRequesition.length ) {
            let sid = toRequesition.pop();
            requestMessage(sid, socket);
        }
    });

});

const saveResult0 = async result  => {
	
	// if( Math.random() > 0.5 ) return;

    try {

        io.emit("e411_result", { data: result });

        // sgh.upload(result, device.id);

        console.log(JSON.stringify(result, undefined, 2));
        // return;

        let resultList = result;
        let deviceId = device.id;

        let userId = 0; // req.params.userId;
        
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

const uploadCodes = async () => {

    let json = {"success":true,"data":{"_id":"5c23481a18627dd040b7351c","name":"E411","__v":0,"codes":[{"download":true,"upload":true,"_id":"5dbebaedbb823d02a3ef7d32","parameter_id":"1188","code":"810"},{"download":true,"upload":true,"_id":"5dbebaedbb823d02a3ef7d31","parameter_id":"1260","code":"810"},{"download":true,"upload":true,"_id":"5d7293f238321908e49c9ffd","parameter_id":"858","code":"680"},{"download":true,"upload":true,"_id":"5c2cab9c090fef27e0d5c37c","parameter_id":"401","code":"311"},{"download":true,"upload":true,"_id":"5c2cab9c090fef27e0d5c391","parameter_id":"1928","code":"710"},{"download":true,"upload":true,"_id":"5c2cab9c090fef27e0d5c38d","parameter_id":"454","code":"170"},{"download":true,"upload":true,"_id":"5c6857a43f48af129734dc04","parameter_id":"1260","code":"810"},{"download":true,"upload":true,"_id":"5c2cab9c090fef27e0d5c38c","parameter_id":"174","code":"460"},{"download":true,"upload":true,"_id":"5c2cab9c090fef27e0d5c396","parameter_id":"849","code":"570"},{"download":true,"upload":true,"_id":"5c2cab9c090fef27e0d5c395","parameter_id":"850"},{"download":true,"upload":false,"_id":"5c236729f5de2325dc120b23","parameter_id":"618","code":"20"},{"download":true,"upload":false,"_id":"5c41e5aa7379cf0c6ce81c7a","parameter_id":"1370","code":"880"},{"download":true,"upload":true,"_id":"5c2cab9c090fef27e0d5c392","parameter_id":"1249","code":"710"},{"download":true,"upload":true,"_id":"5c2cab9c090fef27e0d5c37d","parameter_id":"44","code":"761"},{"download":true,"upload":true,"_id":"5c2cab9c090fef27e0d5c37b","parameter_id":"403","code":"301"},{"download":true,"upload":true,"_id":"5c2cab9c090fef27e0d5c37a","parameter_id":"636","code":"341"},{"download":true,"upload":true,"_id":"5c2cab9c090fef27e0d5c379","parameter_id":"638","code":"332"},{"download":true,"upload":true,"_id":"5c2cab9c090fef27e0d5c378","parameter_id":"639","code":"351"},{"download":true,"upload":true,"_id":"5c236729f5de2325dc120b21","parameter_id":"1296","code":"211"},{"download":true,"upload":true,"_id":"5c2cab9c090fef27e0d5c38a","parameter_id":"392","code":"160"},{"download":true,"upload":true,"_id":"5c2cab9c090fef27e0d5c389","parameter_id":"1645","code":"160"},{"download":true,"upload":true,"_id":"5c2cab9c090fef27e0d5c384","parameter_id":"1271","code":"740"},{"download":true,"upload":true,"_id":"5c2cab9c090fef27e0d5c383","parameter_id":"2115","code":"740"},{"download":true,"upload":true,"_id":"5c2cab9c090fef27e0d5c37f","parameter_id":"390","code":"370"},{"download":true,"upload":true,"_id":"5c2cab9c090fef27e0d5c37e","parameter_id":"2005","code":"370"},{"download":true,"upload":true,"_id":"5c2cab9c090fef27e0d5c385","parameter_id":"122","code":"381"},{"download":true,"upload":true,"_id":"5c2cab9c090fef27e0d5c386","parameter_id":"869","code":"391"},{"download":true,"upload":true,"_id":"5c2cab9c090fef27e0d5c388","parameter_id":"387","code":"150"},{"download":true,"upload":true,"_id":"5c2396d95a12ed6327d43b8f","parameter_id":"1856","code":"240"},{"download":true,"upload":true,"_id":"5c2396d95a12ed6327d43b8d","parameter_id":"1855","code":"610"},{"download":true,"upload":true,"_id":"5c2cab9c090fef27e0d5c38e","parameter_id":"492","code":"170"},{"download":true,"upload":false,"_id":"5c236729f5de2325dc120b2a","parameter_id":"442","code":"900"},{"download":true,"upload":false,"_id":"5c236729f5de2325dc120b29","parameter_id":"171","code":"900"},{"download":true,"upload":false,"_id":"5c236729f5de2325dc120b28","parameter_id":"450","code":"900"},{"download":true,"upload":false,"_id":"5c41e5aa7379cf0c6ce81c5f","parameter_id":"455","code":"880"},{"download":true,"upload":false,"_id":"5c41e5aa7379cf0c6ce81c5e","parameter_id":"1197","code":"880"},{"download":true,"upload":true,"_id":"5c2cab9c090fef27e0d5c387","parameter_id":"388","code":"140"},{"download":true,"upload":true,"_id":"5c2cab9c090fef27e0d5c36a","parameter_id":"1605","code":"510"},{"download":true,"upload":true,"_id":"5c41e5aa7379cf0c6ce81c5b","parameter_id":"391","code":"131"},{"download":true,"upload":true,"_id":"5c2cab9c090fef27e0d5c38b","parameter_id":"1883","code":"160"},{"download":true,"upload":true,"_id":"5c2cab9c090fef27e0d5c381","parameter_id":"389","code":"111"},{"download":true,"upload":false,"_id":"5c2cab9c090fef27e0d5c380","parameter_id":"2106","code":"111"},{"download":true,"upload":true,"_id":"5c236729f5de2325dc120b2e","parameter_id":"870","code":"321"},{"download":true,"upload":true,"_id":"5c41e5aa7379cf0c6ce81c83","parameter_id":"1788","code":"321"},{"download":true,"upload":true,"_id":"5c236729f5de2325dc120b22","parameter_id":"666","code":"90"},{"download":true,"upload":true,"_id":"5c6eb4e32bca0c4b7331c48f","parameter_id":"398","code":"10"},{"download":true,"upload":false,"_id":"5c2396d95a12ed6327d43b91","parameter_id":"1854","code":"10"},{"download":true,"upload":true,"_id":"5c2cab9c090fef27e0d5c390","parameter_id":"396","code":"50"},{"download":true,"upload":true,"_id":"5c2cab9c090fef27e0d5c38f","parameter_id":"397","code":"21"},{"download":true,"upload":false,"_id":"5c2cab9c090fef27e0d5c382","parameter_id":"1777","code":"111"},{"download":true,"upload":true,"_id":"5c2cab9c090fef27e0d5c393","parameter_id":"1128","code":"720"},{"download":true,"upload":false,"_id":"5c2cab9c090fef27e0d5c394","parameter_id":"1101","code":"720"},{"download":true,"upload":true,"_id":"5c41e5aa7379cf0c6ce81c4c","parameter_id":"1100","code":"410"},{"download":true,"upload":true,"_id":"5c236729f5de2325dc120b26","parameter_id":"979","code":"950"},{"download":true,"upload":false,"_id":"5c236729f5de2325dc120b24","parameter_id":"1179","code":"950"}],"id":"110"}};
    let codes = json.data.codes;

    for ( let code of codes ) {
        let sql = `SELECT * FROM Lab_Parameter_Unit WHERE ParameterID = ${code.parameter_id}`;
        // console.log(sql);    
        const results = await sgh.query(sql, { type: Sequelize.QueryTypes.SELECT});

        if ( results.length ) {

            let CODE = {
                deviceId: 2,
                paramId: code.parameter_id,
                paramName: results[0].ParameterName,
                hostCode: code.code,
                upload: code.upload,
                download: code.download 
            }

            const deviceCode = await connection.models.deviceCode.create(CODE);

            console.log(JSON.stringify(CODE, undefined, 4));
        }
    }
};

exports.start = async (io, conn, sghConn) => {

    connection = conn;
    sgh = sghConn;

    // uploadCodes();

    server.listen(PORT, () => {
        console.log(`\nE411 host tcp server listening on ${PORT} `.bgGreen);
    }); 
};

// server.listen(PORT, () => {
//     console.log(`E411 host tcp server listening on ${PORT} `.green);
// });