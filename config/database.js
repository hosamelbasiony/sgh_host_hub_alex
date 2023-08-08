const Sequelize  = require('sequelize');

const mssql = {
  user: 'sghITLab',
  password: 'sghit@2018',
  server: '130.7.1.22',
  database: 'HIS',  
  
  // user: 'sgh',
  // password: 'Yx0k?FsA0r?O',
  // server: 'den1.mssql8.gear.host',
  // database: 'SGH', 

  options: {
      encrypt: true // Use this if you're on Windows Azure 
  }
}

//const mssql = CONFIG.mssql;
module.exports = new Sequelize(mssql.database, mssql.user, mssql.password, 
  {
    host: mssql.server,
    dialect: 'mssql',
    dialectOptions: {
        encrypt: false
    },
  operatorsAliases: false,

  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
});