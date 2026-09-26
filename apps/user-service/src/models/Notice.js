const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

// area_id NULL = visible to all customers
const Notice = sequelize.define("Notice", {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    title: { type: DataTypes.STRING(150), allowNull: false },
    body: { type: DataTypes.TEXT, allowNull: false },
    area_id: { type: DataTypes.BIGINT, allowNull: true },
    created_by: { type: DataTypes.STRING, allowNull: false },
}, {
    tableName: "notices",
    timestamps: true,
    underscored: true,
});

module.exports = Notice;
