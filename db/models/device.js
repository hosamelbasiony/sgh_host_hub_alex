'use strict';
module.exports = (sequelize, DataTypes) => {
  const unit = sequelize.define('device', {
    deviceId: DataTypes.STRING,
    deviceName: DataTypes.STRING,
    deviceImage: DataTypes.TEXT,

  }, {});
  unit.associate = function(models) {
    // associations can be defined here
  };
  return unit;
};


// curl -X POST http://localhost:8003/api/devices -H "Content-Type: application/json" -d '{"deviceId":"61","deviceName":"SysmexUrine","deviceImage":""}'