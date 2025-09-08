const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Area = sequelize.define(
    'Area',
    {
        area_id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        area_name: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
    },
    {
        tableName: 'areas',
        timestamps: false,
        underscored: false,
    }
);

module.exports = Area;


