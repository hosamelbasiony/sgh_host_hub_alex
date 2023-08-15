
const router  = require('express').Router();

module.exports = (connection) => {

    let controller = require('../controllers/sgh')(connection);

    router.get('/params', controller.params);  
    router.get('/tests', controller.tests);  
    router.get('/tests/:testName', controller.testsSearch);  
    router.get('/parameters', controller.parameters);  
    router.get('/by-patient-id/:id/:fromdate/:todate', controller.byPatientId);  
    router.get('/by-order-id/:id/:fromdate/:todate', controller.labNumbersByOrderID);  
    router.get('/by-lab-id/:id/:fromdate/:todate', controller.labNumbersByLabID);  
    router.get('/test', controller.test);  

    router.get('/results/:labNumber/:orderId', controller.resultsByLabOrder);
    
    router.get('/order/:labNumber/:orderId', controller.orderByLabOrder);

    // router.get('/:table/:limit', controller.table);  
    // router.get('/:table', controller.upload);  
    router.get('/upload', controller.upload);  

    return router;
};