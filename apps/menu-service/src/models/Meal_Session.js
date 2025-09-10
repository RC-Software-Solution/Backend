const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Meal_Session = sequelize.define("Meal_Session", {
    id: { 
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        autoIncrement: true 
    },
    date: { 
        type: DataTypes.DATEONLY, 
        allowNull: false 
    },
    meal_time: { 
        type: DataTypes.ENUM('breakfast', 'lunch', 'dinner'), 
        allowNull: false 
    },
    start_time: { 
        type: DataTypes.TIME, 
        allowNull: false 
    },
    end_time: { 
        type: DataTypes.TIME, 
        allowNull: false 
    },
    created_at: { 
        type: DataTypes.DATE, 
        defaultValue: DataTypes.NOW 
    },
    updated_at: { 
        type: DataTypes.DATE, 
        defaultValue: DataTypes.NOW 
    }
}, {
    tableName: "meal_sessions",
    timestamps: true,
    underscored: true,
    indexes: [
        {
            unique: true,
            fields: ['date', 'meal_time'],
            name: 'uq_date_mealtime'
        }
    ]
});

module.exports = Meal_Session;