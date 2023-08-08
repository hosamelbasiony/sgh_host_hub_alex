/* jshint indent: 1 */

module.exports = function(sequelize, DataTypes) {
    return sequelize.define( "labTest",
      {
        TestID: {
          type: DataTypes.INTEGER,
          allowNull: true,
          // primaryKey: true, // added to remove error "Invalid column name 'id'"
          field: "TestID"
        },
        TestName: {
          type: DataTypes.STRING,
          allowNull: true,
          // primaryKey: true, // added to remove error "Invalid column name 'id'"
          field: "TestName"
        },
        TestCode: {
          type: DataTypes.STRING,
          allowNull: true,
          // primaryKey: true, // added to remove error "Invalid column name 'id'"
          field: "TestCode"
        }
      },
      {
        tableName: "Lab_Test",
        timestamps: false // added to remove error "Invalid column name 'updatedAt'"
      }
    );
  };
  