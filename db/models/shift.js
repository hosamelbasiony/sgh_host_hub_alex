'use strict';
module.exports = (sequelize, DataTypes) => {
  const shift = sequelize.define('shift', {
    day: DataTypes.STRING,
    collectionTime: DataTypes.TIME,
    reportingTime: DataTypes.TIME

  }, {});
  shift.associate = function(models) {
    // associations can be defined here
  };
  return shift;
};