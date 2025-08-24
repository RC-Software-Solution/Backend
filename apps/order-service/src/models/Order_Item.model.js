module.exports = (sequelize, DataTypes) => {
  const Order_Item = sequelize.define(
    'Order_Item',
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
      },
      order_id: {
        type: DataTypes.STRING,
        allowNull: false,
        references: { model: 'orders', key: 'id' },
      },
      quantity: { type: DataTypes.INTEGER, allowNull: false },
      food_name: { type: DataTypes.STRING, allowNull: false },
      food_description: { type: DataTypes.STRING, allowNull: false },
      meal_type: {
        type: DataTypes.ENUM('veg', 'non-veg', 'other'),
        allowNull: false,
      },
      price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    },
    {
      tableName: 'order_items',
      timestamps: false,
      underscored: true,
    }
  );

  Order_Item.associate = (models) => {
    Order_Item.belongsTo(models.Order, {
      foreignKey: 'order_id',
      as: 'order',
      onDelete: 'CASCADE',
    });
  };

  Order_Item.beforeValidate((order_item) => {
    const uniquePart = Date.now().toString();
    const rand = Math.random().toString(36).slice(2, 8);
    order_item.id = `ORDITM-${uniquePart}-${rand}`;
  });

  return Order_Item;
};
