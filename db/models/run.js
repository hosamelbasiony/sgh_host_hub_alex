'use strict';
module.exports = (sequelize, DataTypes) => {
  const run = sequelize.define('run', {
    days: {
        type: DataTypes.STRING,
        defaultValue: '0000000'
    },
    runName: DataTypes.STRING,
    collectionTime: DataTypes.TIME,
    reportingTime: DataTypes.TIME,
    reportingLag: {
      type: DataTypes.INTEGER,
      defaultValue: 24
  },

  }, {});
  run.associate = function(models) {
    // associations can be defined here
  };
  return run;
};