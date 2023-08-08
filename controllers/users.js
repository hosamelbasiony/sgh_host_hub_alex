
const express     = require('express');
const bcrypt      = require('bcryptjs');
const jwt         = require('jsonwebtoken');
const uniqid      = require('uniqid');

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
        dummy: async (req, res) => {
            let user = await createDummyUser();
            res.json(user);
        },

        users: async (req, res) => {
            
            const users = await connection.models.user.findAll(); 

            res.json(users);
        },

        register: async (req, res) => {
            const salt = await bcrypt.genSalt(10);

            req.body.password = await bcrypt.hash('asd', salt);
    
            const user = await connection.models.user.create(req.body); 
    
            res.json(user);
        },

        update: async (req, res) => {

            delete req.body.password;

            const user = await connection.models.user.update(req.body, {
                where: {
                    id: req.params.id
                }
            }); 
    
            res.json(user);
        },
    };


    return controller;

};