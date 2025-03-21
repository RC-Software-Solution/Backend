const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Order_Item = sequelize.define("Order_Item", {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true},
    order_id: { type: DataTypes.STRING, allowNull: false, references: { model: "orders", key: "id"}},
    quantity: { type: DataTypes.INTEGER, allowNull: false},
    food_name: { type: DataTypes.STRING, allowNull: false},
    food_description: { type: DataTypes.STRING, allowNull: false},
    meal_time: { type: DataTypes.ENUM('breakfast', 'lunch', 'dinner'), allowNull: false},
    meal_type: { type: DataTypes.ENUM('veg', 'non-veg', 'other'), allowNull: false},
    price: { type: DataTypes.DECIMAL(10, 2), allowNull: false},
    created_at: { type: DataTypes.DATE},
    updated_at: { type: DataTypes.DATE}
}, {
    tableName: "order_items",
    timestamps: true,
    underscored: true
});

Order_Item.beforeCreate((order_item) => {
    const uniquePart = Date.now().toString().slice(-6);
    order_item.id = `ORD_ITEM-${uniquePart}`;
})

module.exports = Order_Item;