'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {

    return queryInterface.createTable('run', {
        days: {
            type: Sequelize.STRING,
            defaultValue: '0000000'
        },
        collectionTime: Sequelize.TIME, 
        reportingTime: Sequelize.TIME
    });

  },

  down: function (queryInterface, Sequelize) {
    //return queryInterface.removeColumn('employees', 'currentEmploymentStatus'),
  }
};