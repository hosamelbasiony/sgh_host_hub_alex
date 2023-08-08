'use strict';

const Sequelize = require('sequelize');

module.exports = (env) => {

  const config = require(__dirname + '/../../config/database.json')[env];

  const connection = new Sequelize(config.database, config.username, config.password, config);
  
  const Params = connection.import('./param');
  const Device = connection.import('./device');
  const DeviceCode = connection.import('./deviceCode');
  const User = connection.import('./user');
  const Shift = connection.import('./shift');
  const Run = connection.import('./run');
  const Test = connection.import('./test');

  // Device.hasMany(DeviceCode, { as : 'DeviceCodes', foreignKey : 'id' });
  Device.hasMany(DeviceCode);
  // DeviceCode.belongsTo(Device, { foreignKey : 'id' });
  DeviceCode.belongsTo(Device);

  // Device.hasMany(DeviceCode);
  // DeviceCode.belongsTo(Device);

  connection.Sequelize = Sequelize;

  return connection;
}

// sequelize db:migrate
// sequelize migration:create --name unit
