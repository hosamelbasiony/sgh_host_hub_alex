/* jshint indent: 1 */

module.exports = function(sequelize, DataTypes) {
    return sequelize.define( "labParameterUnit",
      {
        ParameterID: {
          type: DataTypes.INTEGER,
          allowNull: true,
          // primaryKey: true, // added to remove error "Invalid column name 'id'"
          field: "ParameterID"
        },
        TestID: {
          type: DataTypes.INTEGER,
          allowNull: true,
          // primaryKey: true, // added to remove error "Invalid column name 'id'"
          field: "TestID"
        },
        UnitId: {
          type: DataTypes.INTEGER,
          allowNull: true,
          // primaryKey: true, // added to remove error "Invalid column name 'id'"
          field: "UnitId"
        },
        ParameterName: {
          type: DataTypes.STRING,
          allowNull: true,
          field: "ParameterName"
        },
        UnitName: {
          type: DataTypes.STRING,
          allowNull: true,
          field: "UnitName"
        }
      },
      {
        tableName: "Lab_Parameter_Unit",
        timestamps: false // added to remove error "Invalid column name 'updatedAt'"
      }
    );
  };
  