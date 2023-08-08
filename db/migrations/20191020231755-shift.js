'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {

    return queryInterface.createTable('shift', {
        day: Sequelize.STRING,
        collectionTime: Sequelize.TIME,
        reportingTime: Sequelize.TIME
    });

  },

  down: function (queryInterface, Sequelize) {
    //return queryInterface.removeColumn('employees', 'currentEmploymentStatus'),
  }
};