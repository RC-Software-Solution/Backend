const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/authMiddleware');
const { checkRole } = require('../middlewares/roleMiddleware');
const {
  decrementItemAvailability,
  incrementItemAvailability
} = require('../controllers/inventory.controller');

const adminRoles = ['admin', 'super_admin'];

router.use(authMiddleware);

/**
 * @route POST /api/inventory/decrement
 * @desc Decrement availability for a session item
 * @access Admin, Super Admin
 */
router.post('/decrement', checkRole([...adminRoles, 'customer']), decrementItemAvailability);

/**
 * @route POST /api/inventory/increment
 * @desc Increment availability for a session item
 * @access Admin, Super Admin
 */
router.post('/increment', checkRole([...adminRoles, 'customer']), incrementItemAvailability);

module.exports = router;


