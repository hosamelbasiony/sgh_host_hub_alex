'use strict';

const Sequelize = require('sequelize');

module.exports = (env) => {


  // {
  //   "username": "",
  //   "password": null,
  //   "database": "autoscale",
  //   "dialect": "sqlite",
  //   "storage": "sgh.sqlite",
  //   "logging": false,
  //   "operatorsAliases": false
  // }
    

  const config = {
    // "username": 'LabUser',
    // "password": 'LAB@987',
    // "server": '10.16.12.18',
    // "host": "10.16.12.18",
    // "database": 'LabIntegration',  
    // "dialect": "mssql", 
    
    // https://my.gearhost.com/Account/Login
    // hosam.el.basiony@gmail.com dev@dmin    
    // "username": "sgh",
    // "password": "Yx0k?FsA0r?O",
    // "host": "den1.mssql8.gear.host",
    // "database": "SGH", 
    // "dialect": "mssql",  

    "username": "sa",
    "password": "Secret1234",
    "host": "127.0.0.1",
    "database": "SGH", 
    "dialect": "mssql", 
    
    "options": {
        encrypt: false // Use this if you're on Windows Azure
    },
    "timezone": '+02:00',
    "logging": false,
    "operatorsAliases": false,
    "pool": {
      "max": 5,
      "min": 0,
      "acquire": 30000,
      "idle": 10000
    }
  }

  // const config = require(__dirname + '/../../config/database.json')[env];

  const connection = new Sequelize(config.database, config.username, config.password, config);
  
  // const labEquipment = connection.import('./labEquipment');
  // const labOrder = connection.import('./labOrder');
  // const labParameterUnit = connection.import('./labParameterUnit');
  // const labResult = connection.import('./labResult');
  // const labTest = connection.import('./labTest');
  // const labUser = connection.import('./labUser');

  connection.Sequelize = Sequelize;

  return connection;
}

// sequelize db:migrate
// sequelize migration:create --name unit
