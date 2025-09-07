const express = require('express');
const { 
  getAreaOrders, 
  updatePaymentStatus, 
  getMyAreaOrders 
} = require('../controllers/delivery.controller');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { checkRole } = require('../middlewares/roleMiddleware');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get orders for a specific area (admin/delivery manager use)
router.get('/orders/area', checkRole(['delivery_person', 'admin', 'super_admin']), getAreaOrders);

// Get orders for delivery person's assigned area
router.get('/orders/my-area', checkRole(['delivery_person', 'admin', 'super_admin']), getMyAreaOrders);

// Update payment status of an order
router.put('/orders/:order_id/payment', checkRole(['delivery_person', 'admin', 'super_admin']), updatePaymentStatus);

module.exports = router;
