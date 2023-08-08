'use strict';
module.exports = (sequelize, DataTypes) => {
  const user = sequelize.define('user', {
    userName: DataTypes.STRING,
    userNumber: DataTypes.STRING,
    fullName: DataTypes.STRING,
    password: DataTypes.STRING,
    analyzers: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    reception: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
  }, {});
  user.associate = function(models) {
    // associations can be defined here
  };
  return user;
};