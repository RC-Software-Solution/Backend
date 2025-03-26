const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Food_Item = sequelize.define('Food_Item', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.STRING, allowNull: false },
    price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    meal_time: { type: DataTypes.ENUM('breakfast', 'lunch', 'dinner'), allowNull: false },
    meal_type: { type: DataTypes.ENUM('veg', 'non-veg', 'other'), allowNull: false },
    category: { type: DataTypes.STRING, allowNull: false },
    created_at: { type: DataTypes.DATE },
    updated_at: { type: DataTypes.DATE }
}, {
    tableName: 'food_items',
    timestamps: true,
    underscored: true
});

Food_Item.beforeCreate((food_item) => {
    const uniquePart = Date.now().toString().slice(-6);
    food_item.id = `FOOD_ITEM-${uniquePart}`;
})

module.exports = Food_Item;