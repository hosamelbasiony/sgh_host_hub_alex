
const router  = require('express').Router();

module.exports = (connection) => {

    let controller = require('../controllers/auth')(connection);

    router.post('/authenticate', controller.authenticate);   
    router.post('/password/update/:id', controller.updatePassword);     
    router.put('/password/reset/:id', controller.reset);
    // router.get('/logout', controller.logout);

    return router;
};