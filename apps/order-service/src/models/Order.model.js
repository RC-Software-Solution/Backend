module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define(
    'Order',
    {
      id: { type: DataTypes.STRING, primaryKey: true, allowNull: false },
      customer_id: {
        type: DataTypes.STRING,
        allowNull: false,
        references: { model: 'users', key: 'id' },
      },
      status: {
        type: DataTypes.ENUM(
          'pending',
          'preparing',
          'delivering',
          'completed',
          'cancelled'
        ),
        defaultValue: 'pending',
        allowNull: false,
      },
      meal_time: {
        type: DataTypes.ENUM('breakfast', 'lunch', 'dinner'),
        allowNull: false,
      },
      total_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      payment_status: {
        type: DataTypes.ENUM('pending', 'paid', 'failed'),
        defaultValue: 'pending',
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'orders',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  Order.associate = (models) => {
    Order.hasMany(models.Order_Item, {
      foreignKey: 'order_id',
      as: 'order_items',
      onDelete: 'CASCADE',
      hooks: true,
    });
  };

  //hook to generate uuid for the id column
  Order.beforeValidate((order) => {
    const uniquePart = Date.now().toString();
    const rand = Math.random().toString(36).slice(2, 8);
    order.id = `ORD-${uniquePart}-${rand}`;
  });

  return Order;
};
