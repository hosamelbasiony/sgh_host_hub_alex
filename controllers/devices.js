
// const sql         = require('mssql');
// const Test        = require('../models/test');
// const Parameter   = require('../models/parameter');
// const Device      = require('../models/device');


let config = {
    user: 'sgh',
    password: 'Yx0k?FsA0r?O',
    server: 'den1.mssql8.gear.host',
    database: 'SGH',    
    options: {
        encrypt: true // Use this if you're on Windows Azure
    }
};


module.exports = (connection) => {

    let controller =  {
        devices: async (req, res) => {
            const devices = await connection.models.device.findAll({
                // attributes: ['id', 'deviceId', 'deviceName'],
                include: [{
                    model: connection.models.deviceCode,
                    // required: true,
                    // as: 'Device',
                    // attributes: ['id', 'firstname', 'lastname', 'email']
                }],
                // where: {
                //     id: 1,
                // },
            });

            res.json(devices);
        },

        device: async (req, res) => {
            const devices = await connection.models.device.findOne({
                // attributes: ['id', 'deviceId', 'deviceName'],
                include: [{
                    model: connection.models.deviceCode,
                    // required: true,
                    // as: 'Device',
                    // attributes: ['id', 'firstname', 'lastname', 'email']
                }],
                where: {
                    id: req.params.id,
                },
            });

            res.json(devices);
        },

        newDevice: async (req, res) => {

            const device = await connection.models.device.create(req.body);
            res.json(device);
        },

        updateDevice: async (req, res) => {

            const device = await connection.models.device.update(req.body, {
                where: {
                    id: req.body.id
                }
            });

            res.json(device);
        },

        deleteDevice: async (req, res) => {

            const device = await connection.models.device.destroy({
                where: { id: req.params.id }
            });

            res.json(device);
        },

        newDeviceCode: async (req, res) => {

            const deviceCode = await connection.models.deviceCode.create({
                ...req.body, deviceId: req.params.deviceId
            });

            res.json(deviceCode);
        },
        
        updateDeviceCode: async (req, res) => {

            const deviceCode = await connection.models.deviceCode.update(req.body,{
                where: { id: req.body.id } 
            });

            res.json(deviceCode);
        },

        deleteDeviceCode: async (req, res) => {

            const deviceCode = await connection.models.deviceCode.destroy({
                where: { id: req.params.id }
            });

            res.json(deviceCode);
        },
    };


    return controller;

};