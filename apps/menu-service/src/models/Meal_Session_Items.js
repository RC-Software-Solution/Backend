const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Meal_Session_Item = sequelize.define('Meal_Session_Item', {
    id: { 
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        autoIncrement: true 
    },
    meal_session_id: { 
        type: DataTypes.INTEGER, 
        allowNull: false,
        references: {
            model: 'meal_sessions',
            key: 'id'
        }
    },
    food_item_id: { 
        type: DataTypes.INTEGER, 
        allowNull: false,
        references: {
            model: 'food_items',
            key: 'id'
        }
    },
    available_quantity: { 
        type: DataTypes.INTEGER, 
        allowNull: true 
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
    tableName: 'meal_session_items',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            unique: true,
            fields: ['meal_session_id', 'food_item_id'],
            name: 'uq_session_item'
        }
    ]
});

module.exports = Meal_Session_Item;
