'use strict';

const Sequelize = require('sequelize');

module.exports = (env) => {

    const config = {
        "username": "",
        "password": null,
        "database": "sghorders",
        "dialect": "sqlite",
        "storage": "sghorders.sqlite",
        "logging": false,
        "operatorsAliases": false
    }

    const connection = new Sequelize(config.database, config.username, config.password, config);

    const labEquipment = connection.import('./labEquipment');
    const labOrder = connection.import('./labOrder');
    const labParameterUnit = connection.import('./labParameterUnit');
    const labResult = connection.import('./labResult');
    const labTest = connection.import('./labTest');
    const labUser = connection.import('./labUser');

  
  connection.Sequelize = Sequelize;

  return connection;
}

// sequelize db:migrate
// sequelize migration:create --name unit
