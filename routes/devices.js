
const router  = require('express').Router();

module.exports = (connection) => {

    let controller = require('../controllers/devices')(connection);

    router.get('/', controller.devices);    
    router.get('/:id', controller.device);    
    router.put('/', controller.updateDevice);
    router.post('/', controller.newDevice);
    router.delete('/:id', controller.deleteDevice);
    
    // router.get('/code', controller.newDeviceCode);
    // router.get('/code/:deviceId', controller.newDeviceCode);
    router.post('/code/:deviceId', controller.newDeviceCode);
    router.put('/code', controller.updateDeviceCode);
    router.delete('/code/:id', controller.deleteDeviceCode);

    // router.post('/insert', controller.insertDevices); 
    // router.get('/insertarchi', controller.insertarchi);
    // router.post('/tests/insert/:id', controller.addTestToDevices);
    // router.post('/update/:id', controller.updateDevice);
     
    // router.get('/list/name/:name', controller.device);
    // router.get('/list/id/:id', controller.deviceById);
    
    // router.get('/list/image/:id', controller.deviceImage);
    // router.post('/list/image/:id', controller.addDeviceImage);
    // router.get('/list/images', controller.deviceImages);

    return router;
};