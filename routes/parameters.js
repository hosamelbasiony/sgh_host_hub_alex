// const express 	       = require('express');
// const router           = express.Router();
// const controller = require('../controllers/parameters');

const router  = require('express').Router();

module.exports = (connection) => {

    let controller = require('../controllers/parameters')(connection);

    // router.get('/params', controller.parameters);

    // router.post('/devices/insert', controller.insertDevices);
    // router.get('/devices/insertarchi', controller.insertarchi);
    // router.post('/devices/tests/insert/:id', controller.addTestToDevices);
    // router.post('/devices/update/:id', controller.updateDevice);
    // router.get('/list/devices', controller.devices);

    // router.get('/list/devices/name/:name', controller.device);
    // router.get('/list/devices/id/:id', controller.deviceById);
    
    // router.get('/list/devices/image/:id', controller.deviceImage);
    // router.post('/list/devices/image/:id', controller.addDeviceImage);
    // router.get('/list/devices/images', controller.deviceImages);
    
    router.get('/test/:id', controller.testById);
    router.get('/schedules', controller.schedules);
    router.get('/schedules-extended', controller.schedulesExtended);

    return router;
};