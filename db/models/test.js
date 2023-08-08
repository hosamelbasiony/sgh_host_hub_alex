'use strict';
module.exports = (sequelize, DataTypes) => {
  const test = sequelize.define('test', {
    testID: DataTypes.STRING,
    testName: DataTypes.STRING,
    byRun: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    byShift: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    byHour: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    shiftId: DataTypes.INTEGER,
    runId: DataTypes.INTEGER,
    hours: DataTypes.INTEGER
  }, {});
  test.associate = function(models) {
    // associations can be defined here
  };
  return test;
};