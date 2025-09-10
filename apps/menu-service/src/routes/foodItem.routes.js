const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/authMiddleware');
const { checkRole } = require('../middlewares/roleMiddleware');
const {
  createFoodItem,
  getAllFoodItems,
  getFoodItemById,
  updateFoodItem,
  deleteFoodItem
} = require('../controllers/foodItem.controller');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Apply role-based access control for admin and super-admin
const adminRoles = ['admin', 'super_admin'];

/**
 * @route POST /api/food-items
 * @desc Create a new food item
 * @access Admin, Super Admin
 */
router.post('/', checkRole(adminRoles), createFoodItem);

/**
 * @route GET /api/food-items
 * @desc Get all food items with pagination and filtering
 * @access Admin, Super Admin
 * @query page, limit, meal_type
 */
router.get('/', checkRole(adminRoles), getAllFoodItems);

/**
 * @route GET /api/food-items/:id
 * @desc Get a single food item by ID
 * @access Admin, Super Admin
 */
router.get('/:id', checkRole(adminRoles), getFoodItemById);

/**
 * @route PUT /api/food-items/:id
 * @desc Update a food item
 * @access Admin, Super Admin
 */
router.put('/:id', checkRole(adminRoles), updateFoodItem);

/**
 * @route DELETE /api/food-items/:id
 * @desc Delete a food item
 * @access Admin, Super Admin
 */
router.delete('/:id', checkRole(adminRoles), deleteFoodItem);

module.exports = router;
