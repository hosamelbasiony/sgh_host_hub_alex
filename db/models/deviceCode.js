'use strict';
module.exports = (sequelize, DataTypes) => {
  const unit = sequelize.define('deviceCode', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    deviceId: DataTypes.INTEGER,
    paramId: DataTypes.STRING,
    paramName: DataTypes.STRING,
    hostCode: DataTypes.STRING,
    upload: DataTypes.BOOLEAN,
    download: DataTypes.BOOLEAN
  },
  {
    indexes:[
      {
        unique: false,
        fields:['deviceId']
      }
    ]
  });
  unit.associate = function(models) {
    // associations can be defined here
  };
  return unit;
};