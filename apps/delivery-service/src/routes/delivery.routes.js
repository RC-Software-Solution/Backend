const express = require('express');
const { 
  getAreaOrders, 
  updatePaymentStatus, 
  getMyAreaOrders 
} = require('../controllers/delivery.controller');

const router = express.Router();

// Get orders for a specific area (admin/delivery manager use)
router.get('/orders/area', getAreaOrders);

// Get orders for delivery person's assigned area
router.get('/orders/my-area', getMyAreaOrders);

// Update payment status of an order
router.put('/orders/:order_id/payment', updatePaymentStatus);

module.exports = router;
