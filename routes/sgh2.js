
const router  = require('express').Router();

module.exports = (connection) => {

    let controller = require('../controllers/sgh2')(connection);

    router.get('/params', controller.params);  
    router.get('/tests', controller.tests);  
    router.get('/tests/:testName', controller.testsSearch);  
    router.get('/parameters', controller.parameters);  
    router.get('/by-patient-id/:id', controller.byPatientId);  
    router.get('/by-order-id/:id', controller.labNumbersByOrderID);  
    router.get('/by-lab-id/:id', controller.labNumbersByLabID);  
    router.get('/test', controller.test);  

    // router.get('/:table/:limit', controller.table);  
    // router.get('/:table', controller.upload);  

    return router;
};