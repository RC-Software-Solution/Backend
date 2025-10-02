const redisPublisher = require('../services/redisPublisher');
const menuServiceClient = require('../services/menuServiceClient');
const { Op } = require('sequelize');

const { Order, Order_Item, sequelize } = require('../models');

// Helper function to check if ordering is allowed (handles cross-day sessions)
const isOrderingAllowed = (sessionDate, startTime, endTime) => {
  const now = new Date();
  const [year, month, day] = sessionDate.split('-').map(x => parseInt(x, 10));
  
  // Parse times
  const [startHour, startMinute, startSecond] = startTime.split(':').map(x => parseInt(x, 10));
  const [endHour, endMinute, endSecond] = endTime.split(':').map(x => parseInt(x, 10));
  
  // Create start time (always on session date)
  const sessionStart = new Date(Date.UTC(year, month - 1, day, startHour, startMinute, startSecond || 0));
  
  // Create end time - if end time is smaller than start time, it's next day
  let sessionEnd;
  if (endHour < startHour || (endHour === startHour && endMinute < startMinute)) {
    // Cross-day session: end time is next day
    sessionEnd = new Date(Date.UTC(year, month - 1, day + 1, endHour, endMinute, endSecond || 0));
  } else {
    // Same-day session: end time is same day
    sessionEnd = new Date(Date.UTC(year, month - 1, day, endHour, endMinute, endSecond || 0));
  }
  
  const nowUtc = now.getTime();
  return nowUtc >= sessionStart.getTime() && nowUtc <= sessionEnd.getTime();
};

exports.createOrder = async (req, res) => {
  const { customer_id, items, meal_time, target_date } = req.body;

  try {
    if (
      !customer_id ||
      !items ||
      !Array.isArray(items) ||
      items.length === 0 ||
      !meal_time
    ) {
      return res
        .status(400)
        .json({ message: 'Missing or invalid required fields' });
    }
    //check for unpaid orders
    const unpaidOrders = await Order.count({
      where: {
        customer_id,
        payment_status: 'unpaid', //if this way sucks, add another column to the user table to keep track of unpaid orders
      },
    });
    if (unpaidOrders >= 2) {
      return res
        .status(400)
        .json({ message: 'You have more than two unpaid order' });
    }

    // Use authenticated user from auth middleware to avoid duplicate user-service fetches
    const customerAreaId = req.user?.area_id || null;
    if (!customerAreaId) {
      return res.status(400).json({ message: 'Customer area not found' });
    }

    // Determine the target date for the order
    const orderDate = target_date || new Date().toISOString().split('T')[0];
    const authHeader = req.headers['authorization'] || null;
    const mealSession = await menuServiceClient.getMealSessionByTime(
      orderDate,
      meal_time,
      authHeader
    );
    if (!mealSession) {
      return res.status(400).json({ message: 'Meal session not found' });
    }

    // Enhanced time validation for cross-day sessions and future orders
    if (target_date && target_date < new Date().toISOString().split('T')[0]) {
      return res.status(400).json({
        message: 'Cannot place orders for past dates',
      });
    }

    // Check if ordering is allowed based on session time window (handles cross-day sessions)
    if (!isOrderingAllowed(orderDate, mealSession.start_time, mealSession.end_time)) {
      return res.status(400).json({
        message: 'Order cannot be placed outside the meal session time window',
      });
    }

    // Resolve session items via menu-service and decrement inventory there first
    const sessionItems = await menuServiceClient.getSessionItems(
      mealSession.id,
      authHeader
    );
    const idToSessionItem = new Map(
      sessionItems.map((si) => [si.food_item_id, si])
    );

    const decremented = [];
    try {
      for (const it of items) {
        const foodItemId = it.food_item_id;
        if (!foodItemId || !idToSessionItem.has(foodItemId)) {
          const err = new Error('SESSION_ITEM_NOT_FOUND');
          err.meta = { food_item_id: foodItemId };
          throw err;
        }
        const updated = await menuServiceClient.decrementInventory(
          mealSession.id,
          foodItemId,
          it.quantity,
          authHeader
        );
        decremented.push(updated);
      }
    } catch (e) {
      // compensate any successful decrements
      for (const d of decremented) {
        try {
          await menuServiceClient.incrementInventory(
            d.meal_session_id,
            d.food_item_id,
            // increment back exactly what we decremented; assume one line per item
            // if API doesn't provide delta, default to 1
            items.find((it) => it.food_item_id === d.food_item_id)?.quantity ||
              1,
            authHeader
          );
        } catch (compErr) {
          console.error('Compensation failed:', compErr.message);
        }
      }
      throw e;
    }

    // Compute authoritative total from menu-service prices
    const computedTotal = items.reduce((acc, item) => {
      const si = idToSessionItem.get(item.food_item_id);
      const fi = (si && (si.foodItem || si.food_item)) || {};
      const priceNum =
        fi && fi.price != null ? Number(fi.price) : Number(item.price || 0);
      return acc + priceNum * Number(item.quantity || 0);
    }, 0);

    // Create order and items in a transaction
    const order = await sequelize.transaction(async (t) => {
      const newOrder = await Order.create(
        {
          customer_id,
          area_id: customerAreaId,
          total_price: computedTotal,
          meal_time,
          target_date: orderDate,
        },
        { transaction: t }
      );
      for (const item of items) {
        const si = idToSessionItem.get(item.food_item_id);
        const fi = si.foodItem || si.food_item || {};
        await newOrder.createOrder_item(
          {
            quantity: item.quantity,
            food_name: fi.name || item.food_name || 'Unknown',
            food_description: fi.description || item.food_description || '',
            meal_type: fi.meal_type || item.meal_type || 'other',
            price: fi.price || item.price,
          },
          { transaction: t }
        );
      }

      return newOrder;
    });

    // After commit: publish per-item availability using menu-service response
    await redisPublisher.publishOrderUpdate({
      type: 'session_items.updated',
      sessionId: mealSession.id,
      items: decremented.map((row) => ({
        sessionItemId: row.id,
        foodItemId: row.food_item_id,
        availableQuantity: row.available_quantity,
      })),
    });

    return res
      .status(201)
      .json({ message: 'Order placed successfully', order_id: order.id });
  } catch (error) {
    console.error('Error placing order:', error);
    if (error.message === 'INSUFFICIENT_QTY') {
      return res
        .status(400)
        .json({ message: 'Insufficient quantity for one or more items' });
    }
    if (error.message === 'SESSION_ITEM_NOT_FOUND') {
      return res.status(404).json({
        message: 'One or more session items not found for this session',
      });
    }
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.editOrder = async (req, res) => {
  const { items } = req.body;
  const { order_id } = req.params;

  try {
    if (!items || !Array.isArray(items) || items.length === 0 || !order_id) {
      return res
        .status(400)
        .json({ message: 'Missing or invalid required fields' });
    }

    // Get the existing order
    const order = await Order.findByPk(order_id, {
      include: [{ model: Order_Item, as: 'order_items' }],
    });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify order ownership
    if (order.customer_id !== req.user?.id) {
      return res
        .status(403)
        .json({ message: 'Unauthorized to edit this order' });
    }

    // Get meal session from menu-service using the order's target_date
    const orderDate = order.target_date || new Date().toISOString().split('T')[0];
    const authHeader = req.headers['authorization'] || null;
    const mealSession = await menuServiceClient.getMealSessionByTime(
      orderDate,
      order.meal_time,
      authHeader
    );
    if (!mealSession) {
      return res.status(404).json({ message: 'Meal session not found' });
    }

    // Enhanced validation for cross-day sessions and future orders
    if (order.target_date && order.target_date < new Date().toISOString().split('T')[0]) {
      return res.status(400).json({
        message: 'Cannot edit orders for past dates',
      });
    }

    // Check if editing is allowed based on session time window (handles cross-day sessions)
    if (!isOrderingAllowed(orderDate, mealSession.start_time, mealSession.end_time)) {
      return res.status(400).json({
        message: 'Order cannot be edited outside the meal session time window',
      });
    }

    // Get session items to map food_item_ids
    const sessionItems = await menuServiceClient.getSessionItems(
      mealSession.id,
      authHeader
    );
    const idToSessionItem = new Map(
      sessionItems.map((si) => [si.food_item_id, si])
    );

    // Calculate quantity changes per food_item_id
    const existingItemsByFoodId = new Map();
    order.order_items.forEach((item) => {
      // Find the food_item_id for this order item (we need to match by name or store food_item_id)
      const sessionItem = Array.from(idToSessionItem.values()).find(
        (si) =>
          (si.foodItem && si.foodItem.name === item.food_name) ||
          (si.food_item && si.food_item.name === item.food_name)
      );
      if (sessionItem) {
        existingItemsByFoodId.set(sessionItem.food_item_id, item.quantity);
      }
    });

    const newItemsByFoodId = new Map();
    items.forEach((item) => {
      newItemsByFoodId.set(item.food_item_id, item.quantity);
    });

    // Calculate inventory adjustments
    const inventoryChanges = [];
    const allFoodIds = new Set([
      ...existingItemsByFoodId.keys(),
      ...newItemsByFoodId.keys(),
    ]);

    for (const foodItemId of allFoodIds) {
      const oldQty = existingItemsByFoodId.get(foodItemId) || 0;
      const newQty = newItemsByFoodId.get(foodItemId) || 0;
      const delta = newQty - oldQty;

      if (delta !== 0) {
        inventoryChanges.push({ food_item_id: foodItemId, delta });
      }
    }

    // Apply inventory changes via menu-service
    const changedSessionItems = [];
    try {
      for (const change of inventoryChanges) {
        if (change.delta > 0) {
          // Decrement inventory for increased quantities
          const updated = await menuServiceClient.decrementInventory(
            mealSession.id,
            change.food_item_id,
            change.delta,
            authHeader
          );
          changedSessionItems.push(updated);
        } else if (change.delta < 0) {
          // Increment inventory for decreased quantities
          const updated = await menuServiceClient.incrementInventory(
            mealSession.id,
            change.food_item_id,
            Math.abs(change.delta),
            authHeader
          );
          changedSessionItems.push(updated);
        }
      }
    } catch (e) {
      // Compensate any successful changes
      for (const change of inventoryChanges) {
        try {
          if (change.delta > 0) {
            await menuServiceClient.incrementInventory(
              mealSession.id,
              change.food_item_id,
              change.delta,
              authHeader
            );
          } else if (change.delta < 0) {
            await menuServiceClient.decrementInventory(
              mealSession.id,
              change.food_item_id,
              Math.abs(change.delta),
              authHeader
            );
          }
        } catch (compErr) {
          console.error('Compensation failed:', compErr.message);
        }
      }
      throw e;
    }

    // Compute new total from menu-service prices
    const computedTotal = items.reduce((acc, item) => {
      const si = idToSessionItem.get(item.food_item_id);
      const fi = (si && (si.foodItem || si.food_item)) || {};
      const priceNum = fi && fi.price != null ? Number(fi.price) : 0;
      return acc + priceNum * Number(item.quantity || 0);
    }, 0);

    // Update order and items in transaction
    await sequelize.transaction(async (t) => {
      // Update total price
      await order.update({ total_price: computedTotal }, { transaction: t });

      // Remove old items
      await Order_Item.destroy({ where: { order_id }, transaction: t });

      // Add new items with authoritative data from menu-service
      for (const item of items) {
        const si = idToSessionItem.get(item.food_item_id);
        const fi = (si && (si.foodItem || si.food_item)) || {};
        await order.createOrder_item(
          {
            quantity: item.quantity,
            food_name: fi.name || 'Unknown',
            food_description: fi.description || '',
            meal_type: fi.meal_type || 'other',
            price: fi.price || 0,
          },
          { transaction: t }
        );
      }
        });

    // Broadcast inventory changes
    if (changedSessionItems.length > 0) {
        await redisPublisher.publishOrderUpdate({
        type: 'session_items.updated',
        sessionId: mealSession.id,
        items: changedSessionItems.map((row) => ({
          sessionItemId: row.id,
          foodItemId: row.food_item_id,
          availableQuantity: row.available_quantity,
        })),
      });
    }

    return res.status(200).json({ message: 'Order updated successfully' });
  } catch (error) {
    console.error('Error updating order:', error);
    if (error.message === 'INSUFFICIENT_QTY') {
      return res
        .status(400)
        .json({ message: 'Insufficient quantity for one or more items' });
    }
    if (error.message === 'SESSION_ITEM_NOT_FOUND') {
      return res
        .status(404)
        .json({ message: 'One or more session items not found' });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteOrder = async (req, res) => {
  const { order_id } = req.params;

  try {
    if (!order_id) {
      return res.status(400).json({ message: 'Invalid order_id' });
    }

    const order = await Order.findByPk(order_id, {
      include: [{ model: Order_Item, as: 'order_items' }],
    });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!order.order_items || order.order_items.length === 0) {
      return res.status(400).json({ message: 'Order has no items to delete' });
    }

    // Verify order ownership
    if (order.customer_id !== req.user?.id) {
      return res
        .status(403)
        .json({ message: 'Unauthorized to delete this order' });
    }

    const mealTime = order.meal_time;
    if (!mealTime) {
      return res.status(400).json({ message: 'Meal time not found in order' });
    }

    // Get meal session from menu-service using the order's target_date
    const orderDate = order.target_date || new Date().toISOString().split('T')[0];
    const authHeader = req.headers['authorization'] || null;
    const mealSession = await menuServiceClient.getMealSessionByTime(
      orderDate,
      mealTime,
      authHeader
    );
    if (!mealSession) {
      return res.status(404).json({ message: 'Meal session not found' });
    }

    // Enhanced validation for cross-day sessions and future orders
    if (order.target_date && order.target_date < new Date().toISOString().split('T')[0]) {
      return res.status(400).json({
        message: 'Cannot delete orders for past dates',
      });
    }

    // Check if deletion is allowed based on session time window (handles cross-day sessions)
    if (!isOrderingAllowed(orderDate, mealSession.start_time, mealSession.end_time)) {
      return res.status(400).json({
        message: 'Order cannot be deleted outside the meal session time window',
      });
    }

    // Get session items to map food_item_ids
    const sessionItems = await menuServiceClient.getSessionItems(
      mealSession.id,
      authHeader
    );
    const idToSessionItem = new Map(
      sessionItems.map((si) => [si.food_item_id, si])
    );

    // Calculate inventory adjustments for each item being deleted
    const inventoryChanges = [];
    for (const orderItem of order.order_items) {
      // Find the food_item_id for this order item
      const sessionItem = Array.from(idToSessionItem.values()).find(
        (si) =>
          (si.foodItem && si.foodItem.name === orderItem.food_name) ||
          (si.food_item && si.food_item.name === orderItem.food_name)
      );
      if (sessionItem) {
        inventoryChanges.push({
          food_item_id: sessionItem.food_item_id,
          quantity: orderItem.quantity,
        });
      }
    }

    // Increment inventory back via menu-service
    const changedSessionItems = [];
    try {
      for (const change of inventoryChanges) {
        const updated = await menuServiceClient.incrementInventory(
          mealSession.id,
          change.food_item_id,
          change.quantity,
          authHeader
        );
        changedSessionItems.push(updated);
      }
    } catch (e) {
      // If inventory increment fails, don't delete the order
      console.error('Failed to restore inventory:', e.message);
      return res.status(500).json({ message: 'Failed to restore inventory' });
    }

    // Delete order and items in a transaction
    await sequelize.transaction(async (t) => {
      await order.destroy({ transaction: t });
    });

    // Broadcast inventory changes
    if (changedSessionItems.length > 0) {
    await redisPublisher.publishOrderUpdate({
        type: 'session_items.updated',
        sessionId: mealSession.id,
        items: changedSessionItems.map((row) => ({
          sessionItemId: row.id,
          foodItemId: row.food_item_id,
          availableQuantity: row.available_quantity,
        })),
      });
    }

    return res.status(200).json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getOrders = async (req, res) => {
  const {
    type,
    status,
    meal_type,
    limit,
    offset,
    customer_id,
    area_id,
    payment_status,
    date_range,
    start_date,
    end_date,
  } = req.query;

  try {
    // Log input parameters
    console.log('Received query parameters:', {
      type,
      status,
      meal_type,
      limit,
      offset,
      customer_id,
      user_role: req.user?.role,
      user_id: req.user?.id,
    });

    // Basic validation
    if (!type) {
      return res.status(400).json({ message: 'type parameter is required' });
    }

    // Role-based access control
    const userRole = req.user?.role;
    const userId = req.user?.id;
    const where = {};

    if (userRole === 'customer') {
      where.customer_id = userId;
      console.log('Customer access: filtering by customer_id =', userId);
    } else if (userRole === 'delivery_person') {
      if (!area_id) {
        return res.status(400).json({
          message:
            'Delivery person must select an area (area_id query parameter required)',
        });
      }
      where.area_id = parseInt(area_id);
      console.log('Delivery person access: filtering by area_id =', area_id);
    } else if (userRole === 'admin' || userRole === 'super_admin') {
      if (customer_id) {
        where.customer_id = customer_id;
      }
      if (area_id) {
        where.area_id = area_id;
      }
      console.log('Admin access: unrestricted with optional filters');
    } else {
      return res
        .status(403)
        .json({ message: 'Invalid user role or insufficient permissions' });
    }

    const include = [
      {
        model: Order_Item,
        as: 'order_items',
        required: false,
      },
    ];

    // Handle filter types
    if (type === 'current') {
      // Current orders = orders that are not finished
      where.status = { [Op.in]: ['pending', 'preparing', 'delivering'] };
      console.log('Fetching current orders with status:', where.status);
    } else if (type === 'pending') {
      where.payment_status = 'pending';
      console.log('Fetching pending orders (unpaid)');
    } else {
      return res.status(400).json({ message: 'Invalid type parameter' });
    }

    // Optional filters
    if (status) {
      const statusArray = status.split(',');
      where.status = { [Op.in]: statusArray };
      console.log('Applying status filter:', status);
    }
    if (payment_status) {
      where.payment_status = payment_status;
      console.log('Applying payment_status filter:', payment_status);
    }
    if (meal_type) {
      include[0].where = include[0].where || {};
      include[0].where.meal_type = meal_type;
      console.log('Applying meal_type filter:', meal_type);
    }
    
    const dateFilter = buildDateFilter(date_range, start_date, end_date);
    if (dateFilter) {
      where.created_at = dateFilter;
    }

    // Pagination
    const queryLimit = parseInt(limit) || 10;
    const queryOffset = parseInt(offset) || 0;
    if (
      isNaN(queryLimit) ||
      queryLimit < 1 ||
      isNaN(queryOffset) ||
      queryOffset < 0
    ) {
      return res.status(400).json({ message: 'Invalid limit or offset' });
    }

    // Query orders
    console.log('Querying orders with:', {
      where,
      include,
      limit: queryLimit,
      offset: queryOffset,
      order: [['created_at', 'DESC']],
    });

    const orders = await Order.findAll({
      where,
      include,
      limit: queryLimit,
      offset: queryOffset,
      order: [['created_at', 'DESC']],
    });

    return res.status(200).json({
      message: 'Orders retrieved successfully',
      orders,
      limit: queryLimit,
      offset: queryOffset,
    });
  } catch (error) {
    console.error('Error fetching orders:', {
      error: error.message,
      stack: error.stack,
    });
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.updatePaymentStatus = async (req, res) => {
  const { order_id } = req.params;
  const { payment_status } = req.body;

  try {
    if (!order_id) {
      return res.status(400).json({ message: 'order_id is required' });
    }

    if (
      !payment_status ||
      !['pending', 'paid', 'unpaid'].includes(payment_status)
    ) {
      return res.status(400).json({
        message:
          'Invalid payment_status. Must be one of: pending, paid, unpaid',
      });
    }

    const order = await Order.findByPk(order_id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    await order.update({ payment_status });

    res.status(200).json({
      message: 'Payment status updated successfully',
      order_id,
      payment_status,
      order: {
        id: order.id,
        customer_id: order.customer_id,
        area_id: order.area_id,
        payment_status: order.payment_status,
        status: order.status,
        total_price: order.total_price,
        meal_time: order.meal_time,
      },
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

function buildDateFilter(dateRange, startDate, endDate) {
  const today = new Date();
  let start, end;

  switch (dateRange) {
    case 'today':
      start = new Date(today.setHours(0, 0, 0, 0));
      end = new Date(today.setHours(23, 59, 59, 999));
      break;

    case 'this_week': {
      const firstDay = today.getDate() - today.getDay(); // Sunday
      start = new Date(today.setDate(firstDay));
      start.setHours(0, 0, 0, 0);
      end = new Date(today.setDate(firstDay + 6));
      end.setHours(23, 59, 59, 999);
      break;
    }

    case 'last_week': {
      const firstDay = today.getDate() - today.getDay() - 7;
      start = new Date(today.setDate(firstDay));
      start.setHours(0, 0, 0, 0);
      end = new Date(today.setDate(firstDay + 6));
      end.setHours(23, 59, 59, 999);
      break;
    }

    case 'this_month':
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
      break;

    case 'last_month':
      start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      end = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59);
      break;

    case 'custom':
      if (!startDate || !endDate) return null;
      start = new Date(startDate);
      end = new Date(endDate);
      break;

    default:
      return null; // no filter
  }

  return {
    [Op.between]: [start, end],
  };
}
