
const fs = require("fs");
const axios = require("axios");
const moment = require("moment");
const Sequelize = require('sequelize');
const { Op } = require('sequelize');

const config = require("../config");

const save = (device, result) => {

    console.log(JSON.stringify(result, undefined, 3));
    fs.appendFile(`log/${device.name}-results.txt`, JSON.stringify(result, undefined, 3) + "\n\n", (err) => { });

    // axios.post(`${config.api2}${device.id}`, result)
    //     .then( response => {})
    //     .catch( error => {});
}

const saveResult = async (device, result) => {

    // if( Math.random() > 0.5 ) return;

    try {

        // io.emit("e411_result", { data: result });

        console.log(JSON.stringify(result, undefined, 2));

        let resultList = result;
        let deviceId = device.id;

        let LabNumber = resultList.sampleid;

        for (let line of resultList.lines) {

            if (line.parameterId == null) {
                line.parameterId = 0;
                line.parameter_id = 0;


                const filteredCodes = await global.connection.models.deviceCode.findAll({
                    where: {
                        upload: true,
                        deviceId: device.id,
                        hostCode: line.code
                    }
                });

                for (let filteredCode of filteredCodes) {
                    line.parameterId = filteredCode.paramId;
                    line.parameter_id = filteredCode.paramId;
                    // global.emit("results", result);
                }
            }


            let query = `select * from IPOP_LABORDERS where LabNumber = '${LabNumber}' and ParameterID = ${line.parameterId}`;
            console.log(query);

            let results = await global.sgh.query(query, { type: Sequelize.QueryTypes.SELECT });

            let Status = 0; // from tarqeem
            let UserID = 10137; // from tarqeem
            let EquipmentID = 26; //deviceId; // from tarqeem added manually    

            line.unit = line.unit || '';

            if (results.length) {

                let PatientType = results[0].PatientType;
                let OrderID = results[0].OrderID;
                let TestID = results[0].TestID;


                let query = `select * from Lab_Results where OrderID = ${OrderID} 
                            and LabNumber = '${LabNumber}' and ParameterID = ${line.parameterId} and TestID = ${TestID}`;
                console.log(query);

                let results2 = await global.sgh.query(query, { type: Sequelize.QueryTypes.SELECT });

                if (!results2.length || 1) {

                    let query = `insert into Lab_Results 
                    (OrderID, LabNumber, ParameterID, TestID, Result, EquipmentID, UserID, Status, PatientType, UnitName) 
                    values ('${OrderID}', '${LabNumber}', '${line.parameterId}', 
                    '${TestID}', '${line.result}', '${EquipmentID}', '${UserID}', 
                    '${Status}', '${PatientType}', '${line.unit}')`;

                    console.log(query);

                    await global.sgh.query(query, { type: Sequelize.QueryTypes.INSERT });
                }
            }

        }
    } catch (ex) {
        console.log(ex.stack);
    }
}

const saveResults = async (device, result) => {
    try {

        console.log(JSON.stringify(result, null, 3))

        // io.emit("result", { device, result });

        console.log(JSON.stringify(result, undefined, 2));

        let resultList = result;

        let LabNumber = resultList.sampleid;

        let response = await axios.get(`${config.apiServerIp}/api/Lab/GetLabOrders/LastDays/${config.delayInDays}/LabNumber/${LabNumber}`)
        let retData = response.data;

        console.log("*** LAB ORDER DATA ***", JSON.stringify(retData, null, 3));

        let linesToUpoad = [];

        for (let line of resultList.lines) {

            if (line.parameterId == null) {
                line.parameterId = 0;
                line.parameter_id = 0;


                const filteredCodes = await global.connection.models.deviceCode.findAll({
                    where: {
                        upload: true,
                        deviceId: device.id,
                        hostCode: line.code
                    }
                });

                for (let filteredCode of filteredCodes) {
                    line.parameterId = filteredCode.paramId;
                    line.parameter_id = filteredCode.paramId;
                    // global.emit("results", result);
                }
            }

            let selectedLine = retData.find(x => x.parameterId == line.parameterId);

            if ( selectedLine ) {  

                // line.unit = line.unit || '';
                // let PatientType = line.PatientType;
                // let OrderID = line.OrderID;
                // let TestID = line.TestID;

                linesToUpoad.push({
                    "OrderID": selectedLine.OrderID,
                    "LabNumber": LabNumber,
                    "ParameterID": selectedLine.parameterId,
                    "TestID": selectedLine.TestID,
                    "UnitName": line.unit || '',
                    "Result": line.result.toString(),
                    "EquipmentID": 26,
                    "UserID": "10137",
                    "Status": true,
                    "PatientType": selectedLine.PatientType
                });
            }

        }

        // linesToUpoad
        // 10.16.6.13:8080/api/Lab/UpdateOrderResult

        response = await axios.post(`${config.apiServerIp}/api/Lab/UpdateOrderResult`, linesToUpoad)
        retData = response.data;
        console.log(retData);

    } catch (ex) {
        console.log(ex.stack);
    }
}

const reqCodes = async (device, LabNumber) => {

    const analyzerParamList = await global.connection.models.deviceCode.findAll({
        where: {
            download: true,
            deviceId: device.id,
        }
    });

    // console.log(analyzerParamList);

    let inStatement = [0, ...analyzerParamList.map(x => x.paramId + '')].join(',');

    console.log(inStatement);

    let sql = `SELECT * FROM IPOP_LABORDERS 
    WHERE LabNumber = '${LabNumber}' AND ParameterID IN (${inStatement})`;

    console.log(sql);
    // return;

    const results = await global.sgh.query(sql, { type: Sequelize.QueryTypes.SELECT });

    let ret = [];
    let patientName = '';
    let patientId = '';
    let gender = '';
    let DOB = '19800122';
    // var now = moment("2016-03-08 16:33:12.000").format('YYYYMMDD');

    if (results.length) {
        patientName = results[0].PatientName;
        gender = results[0].Gendar;
        patientId = results[0].PatientId;
        DOB = moment(results[0].DOB).format('YYYYMMDD')

        let paramIdList = results.map(x => x.ParameterId);

        let codesToSend = analyzerParamList.filter(x => x.download && paramIdList.includes(parseInt(x.paramId)));

        for (let param of codesToSend) if (ret.indexOf(param.hostCode) == -1) ret = [...ret, param.hostCode];

    }

    return { codes: ret, patientId, patientName, gender, DOB };

}

module.exports = {
    save,
    saveResult,
    saveResults,
    reqCodes
}