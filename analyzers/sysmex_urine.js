const net               = require('net');
const moment            = require('moment');
const path              = require('path');
const colors            = require("colors");
const astm              = require('./astm/utils');
const fileSystem        = require("fs");
const Sequelize         = require('sequelize');
const { Op }            = require('sequelize');

const config      = require('../config');
const AstmSocketReader  = require('./astm/reader');
const AstmSocketParser  = require('./astm/parser');
// const Device            = require('../models/device');

let inDir = path.resolve(process.cwd(), 'log', 'sysmex_u_in.txt');
let resDir = path.resolve(process.cwd(), 'log', 'sysmex_u_out.txt'); 

let device = {
    _id: '37',
    id: 37,
    name: 'SysmexUrine', //urine
    codes: []
};

let sgh;
let connection;

const PORT = 6789;

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
        
        fileSystem.appendFile('./log/sysmx_urine_out.txt', msgtosend[0].toString(), err => {});  

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
    fileSystem.appendFile('./log/sysmex_urine_out.txt', msgtosend[0].toString(), err => {});  

    if ( socket ) socket.write(ENQ);
};

const server = net.createServer( (socket) => {
    socket.setEncoding();

    console.log('Sysmex-urine client connected to port ' + PORT);

    socket.on ( 'error', err => console.log(`${moment(new Date()).format("YYYY-MM-DD hh:mm:ss")} Archi: Socket error`, err.stack) );


    let reader = new AstmSocketReader(socket, inDir);
    let parser = new AstmSocketParser(socket, device, connection, sgh);

    // console.log('parser set to value')

    reader.on ( 'data', data => {
    
    	console.log(data);
    
        toRequesition = [];
        parser.parse(data, device);
    });
    reader.on ( 'enquired', _ => msgtosend = [] );
    reader.on ( 'negativeacknowledged', _ => msgtosend = [] );
    reader.on ( 'acknowledged', _ => { 
    	console.log("ACK");
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

        console.log(JSON.stringify(result, undefined, 2));
    
    	if(  new Date() != null ) return;

        let resultList = result;
        let deviceId = device.id;

        let userId = config.userId; //10137; // req.params.userId;
        
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
        console.log(`\nSysmex-urine host tcp server listening on ${PORT} `.bgMagenta);
        
        test(conn, sgh);
    }); 
};

const test = (connection, sgh) => {

    let parser = new AstmSocketParser({}, device, connection, sgh);
    parser.on( 'results', results => saveResult(results) );
    parser.on( 'requisition', sid => {
        console.log(sid+ " to request");
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