/* jshint indent: 1 */

module.exports = function(sequelize, DataTypes) {
    return sequelize.define( "labUser",
      {
        UserID: {
          type: DataTypes.STRING,
          allowNull: true,
          // primaryKey: true, // added to remove error "Invalid column name 'id'"
          field: "UserID"
        },
        UserName: {
          type: DataTypes.STRING,
          allowNull: true,
          // primaryKey: true, // added to remove error "Invalid column name 'id'"
          field: "UserName"
        },
        Title: {
          type: DataTypes.STRING,
          allowNull: true,
          // primaryKey: true, // added to remove error "Invalid column name 'id'"
          field: "Title"
        },
        Possition: {
          type: DataTypes.STRING,
          allowNull: true,
          // primaryKey: true, // added to remove error "Invalid column name 'id'"
          field: "Possition"
        }
      },
      {
        tableName: "Lab_User",
        timestamps: false // added to remove error "Invalid column name 'updatedAt'"
      }
    );
  };
  