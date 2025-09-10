const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/authMiddleware');
const { checkRole } = require('../middlewares/roleMiddleware');
const {
  createMealSessionItem,
  listMealSessionItems,
  updateMealSessionItem,
  deleteMealSessionItem
} = require('../controllers/mealSessionItem.controller');

const adminRoles = ['admin', 'super_admin'];

router.use(authMiddleware);

// Create a session item
router.post('/', checkRole(adminRoles), createMealSessionItem);

// List items for a given session
router.get('/:meal_session_id', checkRole(adminRoles), listMealSessionItems);

// Update a session item by id
router.put('/:id', checkRole(adminRoles), updateMealSessionItem);

// Delete a session item by id
router.delete('/:id', checkRole(adminRoles), deleteMealSessionItem);

module.exports = router;


