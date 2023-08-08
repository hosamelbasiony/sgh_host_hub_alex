/* jshint indent: 1 */

module.exports = function(sequelize, DataTypes) {
    return sequelize.define( "labOrder",
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
          field: "LabNumber"
        },
        HospitalCode: {
          type: DataTypes.STRING, 
          allowNull: true,
          field: "HospitalCode"
        },
        BillNo: {
          type: DataTypes.STRING,
          allowNull: true,
          field: "BillNo"
        },
        PatientId: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: "PatientID"
        },
        PatientName: {
          type: DataTypes.STRING,
          allowNull: true,
          field: "PatientName"
        },
        DOB: {
          type: DataTypes.DATE,
          allowNull: false,
          field: "DOB"
        },
        Gendar: {
          type: DataTypes.STRING,
          allowNull: true,
          field: "Gendar"
        },
        ParameterId: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: "ParameterId"
        },
        DateTimeCollected: {
          type: DataTypes.DATE,
          allowNull: true,
          field: "DateTimeCollected"
        },
        PatientType: {
          type: DataTypes.STRING,
          allowNull: true,
          field: "PatientType"
        },
        TestID: {
          type: DataTypes.INTEGER,
          allowNull: true,
          defaultValue: "(NULL)",
          field: "TestID"
        }
      },
      {
        tableName: "IPOP_LABORDERS",
        timestamps: false // added to remove error "Invalid column name 'updatedAt'"
      }
    );
  };
  