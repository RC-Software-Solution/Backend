const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
//const { v4: uuidv4 } = require("uuid");

const Order = sequelize.define("Order", {
    id: { type: DataTypes.STRING, primaryKey: true, allowNull: false },
    customer_id: { type: DataTypes.STRING, allowNull, references: { model: "users", key: "id"}},
    status: { type: DataTypes.ENUM("pending", "preparing", "delivering", "completed", "cancelled"), defaultValue: "pending", allowNull: false},
    total_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false},
    payment_status: { type: DataTypes.ENUM("pending", "paid", "failed"), defaultValue: "pending", allowNull: false},
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: "orders",
    timestamps: true,
    underscored: true
});

//hook to generate uuid for the id column
Order.beforeCreate((order) => {
    const uniquePart = Date.now().toString().slice(-6);
    order.id = `ORD-${uniquePart}`;
});



module.exports = Order;