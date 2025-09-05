const orderServiceClient = require('../services/orderServiceClient');

/**
 * Get pending orders for a specific area
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAreaOrders = async (req, res) => {
  try {
    const { area_id, meal_time, date, payment_status = 'pending' } = req.query;

    if (!area_id) {
      return res.status(400).json({ 
        message: 'area_id is required' 
      });
    }

    // Validate meal_time if provided
    if (meal_time && !['breakfast', 'lunch', 'dinner'].includes(meal_time.toLowerCase())) {
      return res.status(400).json({ 
        message: 'Invalid meal_time. Must be one of: breakfast, lunch, dinner' 
      });
    }

    // Validate payment_status if provided
    if (payment_status && !['pending', 'paid', 'failed'].includes(payment_status)) {
      return res.status(400).json({ 
        message: 'Invalid payment_status. Must be one of: pending, paid, failed' 
      });
    }

    const orders = await orderServiceClient.getOrdersByArea(
      area_id, 
      meal_time, 
      date, 
      payment_status
    );

    res.status(200).json({
      message: 'Orders retrieved successfully',
      area_id,
      meal_time: meal_time || 'all',
      date: date || 'today',
      payment_status,
      orders: orders.orders || [],
      total: orders.orders ? orders.orders.length : 0
    });

  } catch (error) {
    console.error('Error fetching area orders:', error);
    res.status(500).json({ 
      message: 'Failed to fetch orders',
      error: error.message 
    });
  }
};

/**
 * Update payment status of an order
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { order_id } = req.params;
    const { payment_status } = req.body;

    if (!order_id) {
      return res.status(400).json({ 
        message: 'order_id is required' 
      });
    }

    if (!payment_status || !['pending', 'paid', 'unpaid'].includes(payment_status)) {
      return res.status(400).json({ 
        message: 'Invalid payment_status. Must be one of: pending, paid, unpaid' 
      });
    }

    const result = await orderServiceClient.updatePaymentStatus(order_id, payment_status);

    res.status(200).json({
      message: 'Payment status updated successfully',
      order_id,
      payment_status,
      result
    });

  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ 
      message: 'Failed to update payment status',
      error: error.message 
    });
  }
};

/**
 * Get delivery person's assigned area orders
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getMyAreaOrders = async (req, res) => {
  try {
    // This would typically get the delivery person's area from their profile
    // For now, we'll use a query parameter, but in production this should come from auth
    const { area_id } = req.query;
    
    if (!area_id) {
      return res.status(400).json({ 
        message: 'area_id is required. In production, this should come from authenticated user profile.' 
      });
    }

    // Get current meal session orders for the delivery person's area
    const orders = await orderServiceClient.getOrdersByArea(
      area_id, 
      null, // all meal times
      null, // today
      'pending' // only pending payments
    );

    res.status(200).json({
      message: 'Your area orders retrieved successfully',
      area_id,
      orders: orders.orders || [],
      total: orders.orders ? orders.orders.length : 0
    });

  } catch (error) {
    console.error('Error fetching my area orders:', error);
    res.status(500).json({ 
      message: 'Failed to fetch your area orders',
      error: error.message 
    });
  }
};
