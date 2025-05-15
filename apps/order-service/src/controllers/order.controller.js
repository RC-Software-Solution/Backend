const Order = require('../models/Order');
const Order_Item = require('../models/Order_Item');
const Meal_Session = require('../models/Meal_Session');
const sequelize = require('../config/database');

exports.createOrder = async (req, res) => {
  const { customer_id, items, total_price, meal_time } = req.body;

  try {
    //check for unpaid orders
    const unpaidOrders = await Order.count({
      where: {
        customer_id,
        payment_status: 'pending', //if this way sucks, add another column to the user table to keep track of unpaid orders
      },
    });
    if (unpaidOrders > 2) {
      return res.status(400).json({ message: 'You have more than two unpaid order' });
    }

    const mealSession = await Meal_Session.findOne({
      where: {
        meal_time,
        date: sequelize.literal('CURDATE()'),
      },
    });

    if (!mealSession) {
      return res.status(400).json({ message: 'Meal session not found' });
    }

    if (mealSession.current_orders >= mealSession.order_limit) {
      return res.status(400).json({ message: 'Order limit reached' });
    }

    const order = await Order.create({
      customer_id,
      total_price,
    });

    const orderItems = items.map((item) => ({
      order_id: order.id,
      id: item.id,
      quantity: item.quantity,
      food_name: item.food_name,
      food_description: item.food_description,
      meal_time: item.meal_time,
      meal_type: item.meal_type,
      price: item.price,
    }));
    await Order_Item.bulkCreate(orderItems);

    await mealSession.increment('current_orders', { by: items.length });

    for (const item of items) {
      await Meal_Session.increment('current_orders', {
        by: item.quantity,
        where: {
          meal_time: item.meal_time,
          date: sequelize.literal('CURDATE()'),
        },
      });
    }

    return res
      .status(201)
      .json({ message: 'Order placed successfully', order_id: order.id });
  } catch (error) {
    console.error('Error placing order:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
