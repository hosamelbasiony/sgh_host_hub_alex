/* jshint indent: 1 */

module.exports = function(sequelize, DataTypes) {
    return sequelize.define( "labResult",
      {
        OrderID: {
          type: DataTypes.INTEGER,
          allowNull: true,
          // primaryKey: true, // added to remove error "Invalid column name 'id'"
          field: "OrderID"
        },
        LabNumber: {
          type: DataTypes.STRING,
          allowNull: true,
          // primaryKey: true, // added to remove error "Invalid column name 'id'"
          field: "LabNumber"
        },
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
        UnitName: {
          type: DataTypes.STRING,
          allowNull: true,
          field: "UnitName"
        },
        Result: {
          type: DataTypes.STRING,
          allowNull: true,
          field: "Result"
        },
        DateTimeInserted: {
          type: DataTypes.DATE,
          allowNull: true,
          field: "DateTimeInserted"
        },
        UserID: {
          type: DataTypes.STRING,
          allowNull: true,
          field: "UserID"
        },
        Status: {
          type: DataTypes.STRING,
          allowNull: true,
          field: "Status"
        },
        HISDateTime: {
          type: DataTypes.DATE,
          allowNull: true,
          field: "HISDateTime"
        },
        EquipmentID: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: "EquipmentID"
        },
        PatientType: {
          type: DataTypes.STRING,
          allowNull: true,
          field: "PatientType"
        }
      },
      {
        tableName: "Lab_Results",
        timestamps: false // added to remove error "Invalid column name 'updatedAt'"
      }
    );
  };
  