const express = require('express');
const { createOrder, editOrder, deleteOrder } = require('../controllers/order.controller');

const router = express.Router();

router.post('/', createOrder);
router.put('/:order_id', editOrder);
router.delete('/:order_id', deleteOrder);

module.exports = router;
