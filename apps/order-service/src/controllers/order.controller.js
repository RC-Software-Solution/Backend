const Order = require('../models/Order');
const Order_Item = require('../models/Order_Item');
const Meal_Session = require('../models/Meal_Session');
const sequelize = require('../config/database');
const redisPublisher = require('../services/redisPublisher');

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
      return res
        .status(400)
        .json({ message: 'You have more than two unpaid order' });
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

    const updatedSession = await Meal_Session.findOne({
      where: {
        meal_time,
        date: sequelize.literal('CURDATE()'),
      },
    });
    const remainingOrders =
      updatedSession.order_limit - updatedSession.current_orders;
    console.log('Meal time:', meal_time);
    console.log('Remaining orders:', remainingOrders);

    await redisPublisher.publishOrderUpdate({
      meal_time,
      remainingOrders,
    });

    return res
      .status(201)
      .json({ message: 'Order placed successfully', order_id: order.id });
  } catch (error) {
    console.error('Error placing order:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.editOrder = async (req, res) => {
  const { order_id, items, total_price, meal_time } = req.body;

  try {
    //get the existing order
    const order = await Order.findByPk(order_id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    //get the meal session
    const mealSession = await Meal_Session.findOne({
      where: {
        meal_time,
        date: sequelize.literal('CURDATE()'),
      },
    });
    if (!mealSession) {
      return res.status(404).json({ message: 'Meal session not found' });
    }

    //validate time window
    // this block can be ignored if the edit button can be deactivated outside the meal session time window in frontend
    const now = new Date();
    const startTime = new Date(
      `${now.toDateString()} ${mealSession.start_time}`
    );
    const endTime = new Date(`${now.toDateString()} ${mealSession.end_time}`);
    if (now < startTime || now > endTime) {
      return res.status(400).json({
        message: 'Order cannot be edited outside the meal session time window',
      });
    }

    //getting existing order items
    const existingItems = await Order_Item.findAll({
      where: { order_id },
    });
    const oldQuantity = existingItems.reduce(
      (acc, item) => acc + item.quantity,
      0
    );
    const newQuantity = items.reduce((acc, item) => acc + item.quantity, 0);
    const quantityDifference = newQuantity - oldQuantity;

    //validate order limit
    if (
      mealSession.current_orders + quantityDifference >
      mealSession.order_limit
    ) {
      return res
        .status(400)
        .json({ message: 'Order limit exceeded. Cannot add these items.' });
    }

    //transactional update
    await sequelize.transaction(async (t) => {
      //update total price
      await order.update({ total_price }, { transaction: t });

      //remove old items
      await Order_Item.destroy({ where: { order_id }, transaction: t });

      //add new items
      const updatedItems = items.map((item) => ({
        order_id: order.id,
        id: item.id,
        quantity: item.quantity,
        food_name: item.food_name,
        food_description: item.food_description,
        meal_time: item.meal_time,
        meal_type: item.meal_type,
        price: item.price,
      }));
      await Order_Item.bulkCreate(updatedItems, { transaction: t });

      if (quantityDifference !== 0) {
        await mealSession.increment('current_orders', {
          by: quantityDifference,
          transaction: t,
        });

        await redisPublisher.publishOrderUpdate({
          meal_time,
          remainingOrders:
            mealSession.order_limit -
            (mealSession.current_orders + quantityDifference),
        });
      }
    });

    return res.status(200).json({ message: 'Order updated successfully' });
  } catch (error) {
    console.error('Error fetching order:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteOrder = async (req, res) => {
  const { order_id } = req.params;

  try {
    const order = await Order.findByPk(order_id, {
      include: [{ model: Order_Item, as: 'order_items' }],
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const mealTime = order.order_items[0]?.meal_time;
    if (!mealTime) {
      return res.status(400).json({ message: 'Meal time not found in order' });
    }

    const mealSession = await Meal_Session.findOne({
      where: {
        meal_time: mealTime,
        date: sequelize.literal('CURDATE()'),
      },
    });

    if (!mealSession) {
      return res.status(404).json({ message: 'Meal session not found' });
    }

    const now = new Date();
    const startTime = new Date(
      `${now.toDateString()} ${mealSession.start_time}`
    );
    const endTime = new Date(`${now.toDateString()} ${mealSession.end_time}`);

    if (now < startTime || now > endTime) {
      return res
        .status(403)
        .json({ message: 'Order can only be deleted within session time' });
    }

    // Count how many items are being deleted
    const totalQty = order.order_items.reduce(
      (acc, item) => acc + item.quantity,
      0
    );

    // Delete order and items
    await Order_Item.destroy({ where: { order_id: orderId } });
    await Order.destroy({ where: { id: orderId } });

    // Decrement current_orders
    await mealSession.decrement('current_orders', { by: totalQty });

    const updatedSession = await Meal_Session.findByPk(mealSession.id);
    await redisPublisher.publishOrderUpdate({
      meal_time: updatedSession.meal_time,
      remainingOrders:
        updatedSession.order_limit - updatedSession.current_orders,
    });

    return res.status(200).json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
