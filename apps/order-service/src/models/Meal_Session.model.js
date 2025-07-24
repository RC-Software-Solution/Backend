module.exports = (sequelize, DataTypes) => {
  const Meal_Session = sequelize.define(
    'Meal_Session',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      date: { type: DataTypes.DATE, allowNull: false },
      meal_time: {
        type: DataTypes.ENUM('breakfast', 'lunch', 'dinner'),
        allowNull: false,
      },
      start_time: { type: DataTypes.TIME, allowNull: false },
      end_time: { type: DataTypes.TIME, allowNull: false },
      order_limit: { type: DataTypes.INTEGER, allowNull: false },
      current_orders: { type: DataTypes.INTEGER, allowNull: false },
      created_at: { type: DataTypes.DATE },
      updated_at: { type: DataTypes.DATE },
    },
    {
      tableName: 'meal_sessions',
      timestamps: true,
      underscored: true,
    }
  );
  return Meal_Session;
};
