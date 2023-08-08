'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {

    return queryInterface.createTable('test', {
        testID: Sequelize.STRING,
        testName: Sequelize.STRING,
        byRun: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        },
        byShift: {
            type: Sequelize.BOOLEAN,
            defaultValue: true
        },
        byHour: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        },
        shiftId: Sequelize.INTEGER,
        runId: Sequelize.INTEGER,
        hours: Sequelize.INTEGER
        
        });

  },

  down: function (queryInterface, Sequelize) {
    //return queryInterface.removeColumn('employees', 'currentEmploymentStatus'),
  }
};