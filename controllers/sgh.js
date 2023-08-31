
const Sequelize       = require('sequelize');
const { Op }          = require('sequelize');
const moment          = require('moment');
const fs              = require('fs');

module.exports = (connection) => {

    const lagDays = 100000;

    let Parameters = [];
    connection.query("select * from Lab_Parameter_Unit", { type: Sequelize.QueryTypes.SELECT})
        .then( res => {
            // console.log(res);
            Parameters = res;
        });

    let controller =  {
        parameters: async (req, res) => {
            // const params = await connection.models.labParameterUnit.findAll();

            const params = await connection.query("SELECT * FROM Lab_Parameter_Unit", { type: Sequelize.QueryTypes.SELECT});
            res.json(params);
        },

        tests: async (req, res) => {
            // const tests = await connection.models.labTest.findAll();
            const tests = await connection.query("SELECT * FROM Lab_Test", { type: Sequelize.QueryTypes.SELECT});

            res.json(tests);
        },

        testsSearch: async (req, res) => {

            // const tests = await connection.models.labTest.findAll({
            //         where: {
            //             TestName: { [Op.like]: `%${req.params.testName}%` }
            //         }
            //     });
            const tests = await connection.query(`SELECT * FROM Lab_Test WHERE TestName LIKE '%${req.params.testName}%' `, { type: Sequelize.QueryTypes.SELECT});
            res.json(tests);
        }, 

        params: async (req, res) => {
            
            let raw = await fs.readFileSync(`./params.json`);

            res.json({ tests: [], parameters: JSON.parse(raw) });
        },

        params0: async (req, res) => {
            const tests = await connection.query(`SELECT * FROM Lab_Test`, { type: Sequelize.QueryTypes.SELECT});
            const parameters = await connection.query(`SELECT * FROM Lab_Parameter_Unit`, { type: Sequelize.QueryTypes.SELECT});
            res.json({ tests, parameters });
        },

        table: async (req, res) => {
            let query  =`select TOP ${req.params.limit} * from ${req.params.table}`;
            let results = await connection.query(query, { type: Sequelize.QueryTypes.SELECT});
            // let user = await createDummyUser();
            res.json(results);
        },

        upload: async (req, res) => {
            fs.readFile(`./data/${'downloadOrders.json'}`, 'utf8', async (err, data) => {
                if (err) throw err;                
                
                let objs = JSON.parse(data);

                let arrChunks = [];
                let arr = [];

                for ( let obj of objs ) {

                    if ( moment(obj.DateTimeCollected).isAfter('2019-11-15', 'day') ) {
                        
                        // console.log(JSON.stringify(obj, undefined, 4));                    

                        let sql = `insert into IPOP_LABORDERS (OrderID, LabNumber, HospitalCode, BillNo, 
                            PatientId, PatientName, DOB, Gendar, TestID, ParameterId, DateTimeCollected, PatientType)
                            VALUES ('${obj.OrderID}', '${obj.LabNumber}', '${obj.HospitalCode}', '${obj.BillNo}', 
                            '${obj.PatientId}', '${obj.PatientName}', '${obj.DOB}', '${obj.Gendar}', 
                            '${obj.TestID}', '${obj.ParameterId}', '${obj.DateTimeCollected}', '${obj.PatientType}')`;
                
                        let clientInsertId = await connection.query(sql, { type: Sequelize.QueryTypes.INSERT });
                        console.log(clientInsertId);
                    }
                        

                    // console.log(sql);
                }
            });

            res.json({});
        },

        upload0: async (req, res) => {
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
            const results = await connection.query(query, { type: Sequelize.QueryTypes.SELECT});
        
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
        
            // let dateFrom = moment().format('YYYY-MM-DD');
            // dateFrom = moment().subtract(lagDays,'d').format('YYYY-MM-DD hh:mm:ss');

            let fromdate = req.params.fromdate;
            let todate = req.params.todate;

            let date = new Date(fromdate);
            date.setHours(0);
            date.setMinutes(0);
            date.setSeconds(0);
            let dateFrom = moment(date).format('YYYY-MM-DD HH:mm:ss');

            date = new Date(todate);
            date.setHours(23);
            date.setMinutes(59);
            date.setSeconds(59);
            let dateTo = moment(date).format('YYYY-MM-DD HH:mm:ss');


            let records = await connection.query(`SELECT DISTINCT([LabNumber]) AS [LabNumber], [DOB], [Gendar],
                [OrderID], [PatientType], [HospitalCode], [BillNo], [PatientID], [PatientName] 
                FROM [IPOP_LABORDERS] AS [labOrder] WHERE [labOrder].[OrderID] = ${req.params.id}
                AND [labOrder].[DateTimeCollected] >= CAST('${dateFrom}' AS DATE)
                AND [labOrder].[DateTimeCollected] <= CAST('${dateTo}' AS DATE)`, { type: Sequelize.QueryTypes.SELECT});

            let lines = [];

            for ( let record of records ) {
                
                let sql = `SELECT DISTINCT([TestID]) AS [TestID], [DateTimeCollected]
                FROM [IPOP_LABORDERS] AS [labOrder] WHERE [labOrder].[LabNumber] = '${record.LabNumber}'
                AND [labOrder].[DateTimeCollected] >= CAST('${dateFrom}' AS DATE)
                AND [labOrder].[DateTimeCollected] <= CAST('${dateTo}' AS DATE)`;

                let tests = await connection.query(sql, { type: Sequelize.QueryTypes.SELECT});

                let temp = JSON.parse(JSON.stringify(record));

                lines.push({...temp, tests});
            }
            
            res.json(lines);
        },

        resultsByLabOrder: async (req, res) => { 
            
            // http://127.0.0.1:8003/api/sgh/results/15891/229425
            let LabNumber = req.params.labNumber; // 15891
            let OrderID = req.params.orderId; // 229425

            let query  = `select * from Lab_Results where OrderID = ${OrderID} and LabNumber = ${LabNumber}`;
            let savedTestLines = await connection.query(query, { type: Sequelize.QueryTypes.SELECT});
            
            // "id": 2,
            // "OrderID": 229425,
            // "LabNumber": "15891",
            // "ParameterID": 1390,
            // "TestID": 8166,
            // "UnitName": "[x10 ^ 9/L]",
            // "Result": "0.36",
            // "DateTimeInserted": null,
            // "UserID": "10152",
            // "Status": "1",
            // "HISDateTime": "2018-12-01T21:01:09.000Z",
            // "EquipmentID": 29,
            // "PatientType": "OP",
            // "ParameterName": "ABSOLUTE MONOCYTES"

            savedTestLines = savedTestLines.map( x => ({
                id: x.id,
                ParameterName: Parameters.find(p => p.ParameterID == x.ParameterID )?.ParameterName,
                ParameterId: x.ParameterID,
                LabNumber: x.LabNumber,
                OrderID: x.OrderID,
                Result: x.Result,
                HISDateTime: x.HISDateTime,
                UnitName: x.UnitName
            }))

            res.json(savedTestLines);
        },

        orderByLabOrder: async (req, res) => { 
            
            // http://127.0.0.1:8003/api/sgh/results/15891/229425
            let LabNumber = req.params.labNumber; // 15891
            let OrderID = req.params.orderId; // 229425

            let query  = `select * from IPOP_LABORDERS where OrderID = ${OrderID} and LabNumber = ${LabNumber}`;
            let savedTestLines = await connection.query(query, { type: Sequelize.QueryTypes.SELECT});

            // savedTestLines = savedTestLines.map( x => ({
            //     id: x.id,
            //     ParameterName: Parameters.find(p => p.ParameterID == x.ParameterID )?.ParameterName,
            //     ParameterId: x.ParameterID,
            //     LabNumber: x.LabNumber,
            //     OrderID: x.OrderID,
            //     Result: x.Result,
            //     HISDateTime: x.HISDateTime,
            //     UnitName: x.UnitName
            // }))

            res.json(savedTestLines);
        },

        labNumbersByLabID: async (req, res) => { 
        
            // let dateFrom = moment().format('YYYY-MM-DD');
            // dateFrom = moment().subtract(lagDays,'d').format('YYYY-MM-DD hh:mm:ss');

            let fromdate = req.params.fromdate;
            let todate = req.params.todate;

            let date = new Date(fromdate);
            date.setHours(0);
            date.setMinutes(0);
            date.setSeconds(0);
            let dateFrom = moment(date).format('YYYY-MM-DD HH:mm:ss');

            date = new Date(todate);
            date.setHours(23);
            date.setMinutes(59);
            date.setSeconds(59);
            let dateTo = moment(date).format('YYYY-MM-DD HH:mm:ss');

            // let dateFrom = moment(fromdate).subtract(lagDays,'d').format('YYYY-MM-DD hh:mm:ss');
            // let dateTo = moment(date).subtract(lagDays,'d').format('YYYY-MM-DD hh:mm:ss');

            let sql = `SELECT DISTINCT([LabNumber]) AS [LabNumber], [DOB], [Gendar],
            [OrderID], [PatientType], [HospitalCode], [BillNo], [PatientID], [PatientName] 
            FROM [IPOP_LABORDERS] AS [labOrder] 
            WHERE [labOrder].[LabNumber] = '${req.params.id}' 
            AND [labOrder].[DateTimeCollected] >= CAST('${dateFrom}' AS DATE)
            AND [labOrder].[DateTimeCollected] <= CAST('${dateTo}' AS DATE)`;
            
            console.log(dateFrom);
            console.log(dateTo);

            let records = await connection.query(sql, { type: Sequelize.QueryTypes.SELECT});

            let lines = [];

            for ( let record of records ) {

                let sql = `SELECT DISTINCT([TestID]) AS [TestID], [DateTimeCollected]
                FROM [IPOP_LABORDERS] AS [labOrder] WHERE [labOrder].[LabNumber] = '${record.LabNumber}'
                AND [labOrder].[DateTimeCollected] >= CAST('${dateFrom}' AS DATE)
                AND [labOrder].[DateTimeCollected] <= CAST('${dateTo}' AS DATE)`;
                
                let tests = await connection.query(sql, { type: Sequelize.QueryTypes.SELECT});

                let temp = JSON.parse(JSON.stringify(record));

                lines.push({...temp, tests});
            }
            
            res.json(lines);
        },
        
        byPatientId: async (req, res) => {
        
            // 533431
            // 163

            // let dateFrom = moment().format('YYYY-MM-DD');
            // dateFrom = moment().subtract(lagDays,'d').format('YYYY-MM-DD hh:mm:ss');

            let fromdate = req.params.fromdate;
            let todate = req.params.todate;

            let date = new Date(todate);
            date.setHours(0);
            date.setMinutes(0);
            date.setSeconds(0);

            // console.log(fromdate);

            let dateFrom = moment(fromdate).format('YYYY-MM-DD hh:mm:ss');
            let dateTo = moment(date).add(1, 'd').format('YYYY-MM-DD') + ' 23:59:59';

            // console.log(dateTo);

            let sql = `SELECT DISTINCT([LabNumber]) AS [LabNumber], [DOB], [Gendar],
            [OrderID], [PatientType], [HospitalCode], [BillNo], [PatientID], [PatientName] 
            FROM [IPOP_LABORDERS] AS [labOrder] 
            WHERE [labOrder].[PatientID] = ${req.params.id} 
            AND [labOrder].[DateTimeCollected] >= CAST('${dateFrom}' AS DATE)
            AND [labOrder].[DateTimeCollected] <= CAST('${dateTo}' AS DATE)`;
            console.log(sql);
            let records = await connection.query(sql, { type: Sequelize.QueryTypes.SELECT});

            let lines = [];

            for ( let record of records ) {

                let sql = `SELECT DISTINCT([TestID]) AS [TestID], [DateTimeCollected]
                FROM [IPOP_LABORDERS] AS [labOrder] WHERE [labOrder].[LabNumber] = ${record.LabNumber}                    
                AND [labOrder].[DateTimeCollected] >= CAST('${dateFrom}' AS DATE)
                AND [labOrder].[DateTimeCollected] <= CAST('${dateTo}' AS DATE)`;

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