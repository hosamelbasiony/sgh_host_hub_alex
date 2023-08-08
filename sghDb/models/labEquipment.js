/* jshint indent: 1 */

module.exports = function(sequelize, DataTypes) {
    return sequelize.define( "labEquipment",
      {
        EquipmentID: {
          type: DataTypes.INTEGER,
          allowNull: true,
          // primaryKey: true, // added to remove error "Invalid column name 'id'"
          field: "EquipmentID"
        },
        EquipmentName: {
          type: DataTypes.STRING,
          allowNull: true,
          field: "EquipmentName"
        },
      },
      {
        tableName: "Lab_Equipment",
        timestamps: false // added to remove error "Invalid column name 'updatedAt'"
      }
    );
  };
  