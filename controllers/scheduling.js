
const Sequelize       = require('sequelize');
const { Op }          = require('sequelize');
const moment          = require('moment');
const fs              = require('fs');

module.exports = (connection) => {

    let controller =  {
        runs: async (req, res) => {
            const params = await connection.models.run.findAll();
            res.json(params);
        },   

        newRun: async (req, res) => {
            const run = await connection.models.run.create(req.body);
            res.status(200).json( run );
        },     

        updateRun: async (req, res) => {
            const run = await connection.models.run.update(
                req.body,
                {
                    where: {
                        id: req.body.id
                    }
                }
            );
            res.status(200).json( run );
        },   

        deleteRun: async (req, res) => {
            const ret = await connection.models.run.destroy(
                {
                    where: {
                        id: req.params.id
                    }
                }
            );
            res.status(200).json( ret );
        },     

        shifts: async (req, res) => {
            const params = await connection.models.shift.findAll({
                where: {
                    day: req.params.day
                }
            });
            res.json(params);
        },   

        addTestSchedule: async (req, res) => {
            delete req.body.id;
            const test = await connection.models.test.create(req.body);
            res.status(200).json( test );
        },  

        editTestSchedule: async (req, res) => {
            const test = await connection.models.test.update(
                req.body,
                {
                    where: {
                        id: req.params.id
                    }
                });
            res.status(200).json( test );
        },     

        schedulesList: async (req, res) => {
            const schedules = await connection.models.test.findAll({
                where: {
                    testID: { // integer
                        [Op.in]: req.body
                    }
                }
            });

            res.status(200).json( schedules );
        },     

        newShift: async (req, res) => {
            const shift = await connection.models.shift.create(req.body);
            res.status(200).json( shift );
        },     

        updateShift: async (req, res) => {
            const shift = await connection.models.shift.update(
                req.body,
                {
                    where: {
                        id: req.body.id
                    }
                }
            );
            res.status(200).json( shift );
        },   

        deleteShift: async (req, res) => {
            const ret = await connection.models.shift.destroy(
                {
                    where: {
                        id: req.params.id
                    }
                }
            );
            res.status(200).json( ret );
        },     
        
    };

    return controller;

};