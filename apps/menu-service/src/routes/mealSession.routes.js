const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/authMiddleware');
const { checkRole } = require('../middlewares/roleMiddleware');
const {
  createMealSession,
  getAllMealSessions,
  getMealSessionById,
  updateMealSession,
  deleteMealSession,
  addItemsToMealSession
} = require('../controllers/mealSession.controller');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Apply role-based access control for admin and super-admin
const adminRoles = ['admin', 'super_admin'];

/**
 * @route POST /api/meal-sessions
 * @desc Create a new meal session
 * @access Admin, Super Admin
 */
router.post('/', checkRole(adminRoles), createMealSession);

/**
 * @route GET /api/meal-sessions
 * @desc Get all meal sessions with pagination and filtering
 * @access Admin, Super Admin
 * @query page, limit, meal_time, date
 */
router.get('/', checkRole(adminRoles), getAllMealSessions);

/**
 * @route GET /api/meal-sessions/:id
 * @desc Get a single meal session by ID with food items
 * @access Admin, Super Admin
 */
router.get('/:id', checkRole(adminRoles), getMealSessionById);

/**
 * @route PUT /api/meal-sessions/:id
 * @desc Update a meal session
 * @access Admin, Super Admin
 */
router.put('/:id', checkRole(adminRoles), updateMealSession);

/**
 * @route DELETE /api/meal-sessions/:id
 * @desc Delete a meal session
 * @access Admin, Super Admin
 */
router.delete('/:id', checkRole(adminRoles), deleteMealSession);

/**
 * @route POST /api/meal-sessions/:id/items
 * @desc Add food items to a meal session
 * @access Admin, Super Admin
 */
router.post('/:id/items', checkRole(adminRoles), addItemsToMealSession);

module.exports = router;
