
const bcrypt      = require('bcryptjs');
const jwt         = require('jsonwebtoken');

const config      = require('../config');

module.exports = (connection) => {

    const createDummyUser = async () => {
        let tarqeem = {
            userName: 'tarqeem',
            userNumber: '0', 
            fullName: 'Tarqeem LIS', 
        };

        const salt = await bcrypt.genSalt(10);

        tarqeem.password = await bcrypt.hash('asd', salt);
 
        const user = await connection.models.user.create(tarqeem); 

        return user;
    };

    let controller =  {

        updatePassword: async (req, res) => {

            const salt = await bcrypt.genSalt(10);
            let password = await bcrypt.hash(req.body.password, salt);

            const user = await connection.models.user.update({
                password
            }, 
            {
                where: {
                    id: req.params.id
                }
            })

            res.json(user);
        },

        reset: async (req, res) => {

            const salt = await bcrypt.genSalt(10);
            let password = await bcrypt.hash('asd', salt);

            const user = await connection.models.user.update({
                password
            }, 
            {
                where: {
                    id: req.params.id
                }
            })

            res.json(user);
        },

        authenticate: async (req, res) => {

            const tarqeemUser = await connection.models.user.findOne({ 
                where: {
                    username: 'tarqeem' 
                }
            });

            
            if ( tarqeemUser == null ) {
                let user = await createDummyUser();
                res.json(user);     
                return;                   
            }

            const user = await connection.models.user.findOne({ 
                where: {
                    username: req.body.username
                }
            });

            if (!user) res.json({ success: false, message: 'Authentication failed. User not found.' });
            else {
                const isMatch = await bcrypt.compare(req.body.password, user.password);

                if ( !isMatch ) {
                    res.json({ success: false, message: 'Authentication failed. Wrong password.' });
                } else {
                    user.password = '';
                    
                    let token = jwt.sign({ user }, config.secret, {
                        expiresIn: config.tokenExpiry
                    });
                    res.json({
                        success: true,
                        message: 'Login success',
                        user: user,
                        token: token
                    });
                }
                
            }
        },
    };


    return controller;

};