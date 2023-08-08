const colors      = require("colors");

const Sequelize   = require('sequelize');

const database        = require('../../config/database');

exports.requisition = async (LabNumber, codes) => {

    const analyzerParamList = codes.filter ( x => x.download ).map( x => x.parameter_id ).join(',');
    LabNumber = LabNumber.replace(/^0+/, '');
	LabNumber = LabNumber.replace(/@/, '');

    let query  =`select * from IPOP_LABORDERS where LabNumber = ${LabNumber} and ParameterID in (${analyzerParamList})`;
    const results = await database.query(query, { type: Sequelize.QueryTypes.SELECT});

    let ret = [];
    let patientName = '';
    let patientId = '';
    
    if ( results.length ) {
        patientName = results[0].PatientName;
        patientId = results[0].PatientId;
    
        let paramIdList = results.map ( x => x.ParameterId );    
    
        let codesToSend = codes.filter ( x => x.download && paramIdList.includes(parseInt(x.parameter_id)) );
    
        for ( let param of codesToSend )  if ( ret.indexOf(param.code ) == -1 ) ret = [...ret, param.code];     

    }

    return { codes: ret, patientId, patientName };
};

exports.params = async (LabNumber, codes, code) => {

    LabNumber = LabNumber.replace(/^0+/, '');
	LabNumber = LabNumber.replace(/@/, '');
    let ret = [];

    let query  =`select * from IPOP_LABORDERS where LabNumber = ${LabNumber}`;
    const results = await database.query(query, { type: Sequelize.QueryTypes.SELECT});
    
    for ( let line of results ) {      

        let params = codes.filter ( x => x.code == code && x.parameter_id == line.ParameterId );   
    
    	for ( let param of params ) if ( ret.indexOf(param.parameter_id ) == -1 ) ret = [...ret, param.parameter_id];

    }

    return ret;
};

exports.getFilteredParams = async (LabNumber, resultCodes) => {
    
    LabNumber = LabNumber.replace(/^0+/, '');
	LabNumber = LabNumber.replace(/@/, '');

    let query  =`select distinct ParameterID from IPOP_LABORDERS 
                 where LabNumber = ${LabNumber} 
                 and ParameterID in (${resultCodes.map ( x => x.parameter_id ).join(',')})`;
    let results = await database.query(query, { type: Sequelize.QueryTypes.SELECT});
    let orderedLineParamIds = results.map( line => line.ParameterID);
	
	console.log('orderedLineParamIds', orderedLineParamIds);
    
    resultCodes = resultCodes.filter( x => orderedLineParamIds.includes( parseInt(x.parameter_id )) );

	console.log('resultCodes', resultCodes);
                   
    return resultCodes;
};

exports.upload = async ( resultList, deviceId ) => {

    // if ( deviceId == 1 ) deviceId = 29;
    // else if ( deviceId == 2 ) deviceId = 30;

    let userId = 0; // req.params.userId;
    
    let LabNumber = resultList.sampleid;

    for ( let line of resultList.lines ) {
        
        let query  = `select * from IPOP_LABORDERS where LabNumber = ${LabNumber} and ParameterID = ${line.parameterId}`;
        let results = await database.query(query, { type: Sequelize.QueryTypes.SELECT});

        let Status = 0; // from tarqeem
        let UserID = userId; // from tarqeem
        let EquipmentID = deviceId; // from tarqeem added manually    

        line.unit = line.unit || '';

        if ( results.length ) {

            let PatientType = results[0].PatientType;
            let OrderID = results[0].OrderID;
            let TestID = results[0].TestID;


            let query  = `select * from Lab_Results where OrderID = ${OrderID} and LabNumber = ${LabNumber} and ParameterID = ${line.parameterId} and TestID = ${TestID}`;
            let results2 = await database.query(query, { type: Sequelize.QueryTypes.SELECT});
            if ( !results2.length ) {
                let query  = `insert into Lab_Results 
                (OrderID, LabNumber, ParameterID, TestID, Result, EquipmentID, UserID, Status, PatientType, UnitName) 
                values ('${OrderID}', '${LabNumber}', '${line.parameterId}', '${TestID}', '${line.result}', '${EquipmentID}', '${UserID}', '${Status}', '${PatientType}', '${line.unit}')`;

                await database.query(query, { type: Sequelize.QueryTypes.INSERT});
            }             
        } 

    }

}