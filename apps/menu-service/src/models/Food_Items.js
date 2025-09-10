const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Food_Item = sequelize.define('Food_Item', {
    id: { 
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        autoIncrement: true 
    },
    name: { 
        type: DataTypes.STRING(255), 
        allowNull: false 
    },
    description: { 
        type: DataTypes.TEXT, 
        allowNull: true 
    },
    price: { 
        type: DataTypes.DECIMAL(10, 2), 
        allowNull: false 
    },
    meal_type: { 
        type: DataTypes.ENUM('veg', 'non-veg', 'other'), 
        allowNull: false 
    },
    image_url: { 
        type: DataTypes.STRING(500), 
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
    tableName: 'food_items',
    timestamps: true,
    underscored: true
});

module.exports = Food_Item;