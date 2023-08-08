
const router  = require('express').Router();

module.exports = (connection) => {

    let controller = require('../controllers/users')(connection);

    router.get('/', controller.users);  
    router.get('/dummy', controller.dummy);     
    router.post('/register', controller.register);
    router.put('/:id', controller.update);

    return router;
};