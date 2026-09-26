const express = require('express');
const { createOrder, editOrder, deleteOrder, getOrders, updatePaymentStatus, updateOrderStatus } = require('../controllers/order.controller');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { checkRole } = require('../middlewares/roleMiddleware');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

router.get('/', getOrders);
router.post('/', createOrder);
router.put('/:order_id', editOrder);
router.put('/:order_id/payment', checkRole(['delivery_person', 'admin', 'super_admin']), updatePaymentStatus);
router.put('/:order_id/status', checkRole(['delivery_person', 'admin', 'super_admin']), updateOrderStatus);
router.delete('/:order_id', deleteOrder);


module.exports = router;
