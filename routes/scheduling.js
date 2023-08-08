
const router  = require('express').Router();

module.exports = (connection) => {

    let controller = require('../controllers/scheduling')(connection);

    router.get('/shifts/:day', controller.shifts);  
    router.delete('/shifts/:id', controller.deleteShift);  
    router.put('/shifts', controller.updateShift);  
    router.post('/shifts', controller.newShift);  

    router.get('/runs', controller.runs);  
    router.delete('/runs/:id', controller.deleteRun);  
    router.put('/runs', controller.updateRun);  
    router.post('/runs', controller.newRun);  
    
    router.put('/test/:id', controller.editTestSchedule);  
    router.post('/test', controller.addTestSchedule);  
    router.post('/schedules-list', controller.schedulesList);  

    return router;
};