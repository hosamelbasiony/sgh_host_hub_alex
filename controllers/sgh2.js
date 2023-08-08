
const Sequelize       = require('sequelize');
const { Op }          = require('sequelize');
const moment          = require('moment');
const fs              = require('fs');

module.exports = (connection) => {

    const lagDays = 100000;

    let controller =  {
        parameters: async (req, res) => {
            const params = await connection.models.labParameterUnit.findAll();
            res.json(params);
        },

        tests: async (req, res) => {
            const tests = await connection.models.labTest.findAll();
            res.json(tests);
        },

        testsSearch: async (req, res) => {

            const tests = await connection.models.labTest.findAll({
                where: {
                    TestName: { [Op.like]: `%${req.params.testName}%` }
                }
            });

            res.json(tests);
        }, 

        params: async (req, res) => {
            const parameters = await connection.models.labParameterUnit.findAll();
            const tests = await connection.models.labTest.findAll();
            
            res.json({ tests, parameters });
        },

        table: async (req, res) => {
            let query  =`select TOP ${req.params.limit} * from ${req.params.table}`;
            let results = await connection.query(query, { type: Sequelize.QueryTypes.SELECT});
            // let user = await createDummyUser();
            res.json(results);
        },

        upload: async (req, res) => {
            fs.readFile(`./data/${req.params.table}.json`, 'utf8', async (err, data) => {
                if (err) throw err;
                
                let objs = JSON.parse(data);

                let arrChunks = [];
                let arr = [];

                for ( let obj of objs ) {

                    arr = [...arr, obj];

                    // const line = await connection.models.labOrder.create(obj);
                    // const line = await connection.models.labEquipment.create(obj);
                    // const line = await connection.models.labParameterUnit.create(obj);
                    if ( arr.length >= 1000 ) {
                        arrChunks = [...arrChunks, arr];
                        arr = [];
                    }
                }

                if ( arr.length ) arrChunks = [...arrChunks, arr];

                for ( let chunk of arrChunks ) {
                    // await connection.models.labResult.bulkCreate(chunk);
                    // await connection.models.labUser.bulkCreate(chunk);
                    // await connection.models.labOrder.bulkCreate(chunk);
                    // await connection.models.labTest.bulkCreate(chunk);
                    // await connection.models.labParameterUnit.bulkCreate(chunk);
                    await connection.models.labEquipment.bulkCreate(chunk);
                }
                
                // const lines = await connection.models.labOrder.bulkCreate(objs);
                res.json(objs.length);
            });
        },

        detailed: async (req, res) => { 
            let ret = { success: true, data: {} };
        
            let query  =`select * from IPOP_LABORDERS where LabNumber = ${req.params.labnumber} AND DateTimeCollected > (SELECT (DATEADD(day, -15,  GETDATE())) AS DATE)`;
            const results = await database.query(query, { type: Sequelize.QueryTypes.SELECT});
        
            if ( results.length ) {
                let tests = [];
                for ( let line of results ) tests = [...tests, line.TestID];
                ret.data = results[0];
                if ( ret.data.Gender == undefined ) ret.data.Gender = ret.data.Gendar;
                ret.data.Tests = tests;    
            } else {
                ret.data = {
                    PatientName: '- - -',
                    DOB: new Date(),
                    Gender: '- - -',
                    BillNo: '-',
                    PatientType: '-',
                    Tests: []
                };
            }
            res.json(ret);
        },
        
        labNumbersByOrderID: async (req, res) => { 
        
            let dateFrom = moment().format('YYYY-MM-DD');
            dateFrom = moment().subtract(lagDays,'d').format('YYYY-MM-DD hh:mm:ss');


            let records = await connection.query(`SELECT DISTINCT([LabNumber]) AS [LabNumber], [DOB], [Gendar],
                [OrderID], [PatientType], [HospitalCode], [BillNo], [PatientID], [PatientName] 
                FROM [IPOP_LABORDERS] AS [labOrder] WHERE [labOrder].[OrderID] = ${req.params.id}
                AND [labOrder].[DateTimeCollected] >= CAST('${dateFrom}' AS DATE)`, { type: Sequelize.QueryTypes.SELECT});

            let lines = [];

            for ( let record of records ) {
                
                let sql = `SELECT DISTINCT([TestID]) AS [TestID], [DateTimeCollected]
                FROM [IPOP_LABORDERS] AS [labOrder] WHERE [labOrder].[LabNumber] = ${record.LabNumber}`;
                let tests = await connection.query(sql, { type: Sequelize.QueryTypes.SELECT});

                let temp = JSON.parse(JSON.stringify(record));

                lines.push({...temp, tests});
            }
            
            res.json(lines);
        },

        labNumbersByLabID: async (req, res) => { 
        
            let dateFrom = moment().format('YYYY-MM-DD');
            dateFrom = moment().subtract(lagDays,'d').format('YYYY-MM-DD hh:mm:ss');

            let sql = `SELECT DISTINCT([LabNumber]) AS [LabNumber], [DOB], [Gendar],
            [OrderID], [PatientType], [HospitalCode], [BillNo], [PatientID], [PatientName] 
            FROM [IPOP_LABORDERS] AS [labOrder] 
            WHERE [labOrder].[LabNumber] = ${req.params.id} 
            AND [labOrder].[DateTimeCollected] >= CAST('${dateFrom}' AS DATE)`;
            let records = await connection.query(sql, { type: Sequelize.QueryTypes.SELECT});

            let lines = [];

            for ( let record of records ) {

                let sql = `SELECT DISTINCT([TestID]) AS [TestID], [DateTimeCollected]
                FROM [IPOP_LABORDERS] AS [labOrder] WHERE [labOrder].[LabNumber] = ${record.LabNumber}`;
                let tests = await connection.query(sql, { type: Sequelize.QueryTypes.SELECT});

                let temp = JSON.parse(JSON.stringify(record));

                lines.push({...temp, tests});
            }
            
            res.json(lines);
        },
        
        byPatientId: async (req, res) => {
        
            // 533431
            // 163

            let dateFrom = moment().format('YYYY-MM-DD');
            dateFrom = moment().subtract(lagDays,'d').format('YYYY-MM-DD hh:mm:ss');

            let sql = `SELECT DISTINCT([LabNumber]) AS [LabNumber], [DOB], [Gendar],
            [OrderID], [PatientType], [HospitalCode], [BillNo], [PatientID], [PatientName] 
            FROM [IPOP_LABORDERS] AS [labOrder] 
            WHERE [labOrder].[PatientID] = ${req.params.id} 
            AND [labOrder].[DateTimeCollected] >= CAST('${dateFrom}' AS DATE)`;
            let records = await connection.query(sql, { type: Sequelize.QueryTypes.SELECT});

            let lines = [];

            for ( let record of records ) {

                let sql = `SELECT DISTINCT([TestID]) AS [TestID], [DateTimeCollected]
                FROM [IPOP_LABORDERS] AS [labOrder] WHERE [labOrder].[LabNumber] = ${record.LabNumber}`;
                let tests = await connection.query(sql, { type: Sequelize.QueryTypes.SELECT});

                let temp = JSON.parse(JSON.stringify(record));

                lines.push({...temp, tests});
            }
            
            res.json(lines);       
        },
        
        test: async (req, res) => {

            let LabNumber = '139088';
            let analyzerParamList = [{paramId: 664}, {paramId: 324}];
        
            const results = await connection.models.labOrder.findAll({
                where: {
                    LabNumber: LabNumber,
                    ParameterID: { // integer
                        [Op.in]: analyzerParamList.map( x => x.paramId )
                    }
                }
            });

            // const results = await connection.query(`SELECT * FROM IPOP_LABORDERS 
            //     WHERE LabNumber = ${LabNumber} AND ParameterID IN (${analyzerParamList.map( x => x.paramId ).join(',')})`, { type: Sequelize.QueryTypes.SELECT});

            res.json(results);       
        },
        
        
    };

    return controller;

};