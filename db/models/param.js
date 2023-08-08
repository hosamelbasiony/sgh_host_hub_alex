'use strict';
module.exports = (sequelize, DataTypes) => {
  const unit = sequelize.define('param', {
    parameterID: DataTypes.STRING,
    parameterName: DataTypes.STRING,
    testID: DataTypes.STRING,
    unitName: DataTypes.STRING

  }, {});
  unit.associate = function(models) {
    // associations can be defined here
  };
  return unit;
};