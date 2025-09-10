const { Meal_Session, Food_Item, Meal_Session_Item } = require('../models');

/**
 * Create a new meal session
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createMealSession = async (req, res) => {
  try {
    const { date, meal_time, start_time, end_time } = req.body;

    // Validate required fields
    if (!date || !meal_time || !start_time || !end_time) {
      return res.status(400).json({
        success: false,
        message: 'Date, meal_time, start_time, and end_time are required fields'
      });
    }

    // Validate meal_time
    const validMealTimes = ['breakfast', 'lunch', 'dinner'];
    if (!validMealTimes.includes(meal_time)) {
      return res.status(400).json({
        success: false,
        message: 'meal_time must be one of: breakfast, lunch, dinner'
      });
    }

    // Validate time format
    const startTime = new Date(`2000-01-01T${start_time}`);
    const endTime = new Date(`2000-01-01T${end_time}`);
    
    if (startTime >= endTime) {
      return res.status(400).json({
        success: false,
        message: 'start_time must be before end_time'
      });
    }

    const mealSession = await Meal_Session.create({
      date,
      meal_time,
      start_time,
      end_time
    });

    res.status(201).json({
      success: true,
      message: 'Meal session created successfully',
      data: mealSession
    });
  } catch (error) {
    console.error('Error creating meal session:', error);
    
    // Handle unique constraint violation
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: 'A meal session already exists for this date and meal time'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create meal session',
      error: error.message
    });
  }
};

/**
 * Get all meal sessions with pagination
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllMealSessions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const meal_time = req.query.meal_time;
    const date = req.query.date;

    // Build where clause
    const whereClause = {};
    if (meal_time) {
      const validMealTimes = ['breakfast', 'lunch', 'dinner'];
      if (validMealTimes.includes(meal_time)) {
        whereClause.meal_time = meal_time;
      }
    }
    if (date) {
      whereClause.date = date;
    }

    const { count, rows } = await Meal_Session.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['date', 'DESC'], ['meal_time', 'ASC']],
      include: [
        {
          model: Meal_Session_Item,
          as: 'sessionItems',
          include: [
            {
              model: Food_Item,
              as: 'foodItem'
            }
          ]
        }
      ]
    });

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      success: true,
      message: 'Meal sessions retrieved successfully',
      data: {
        mealSessions: rows,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: count,
          itemsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching meal sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meal sessions',
      error: error.message
    });
  }
};

/**
 * Get a single meal session by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getMealSessionById = async (req, res) => {
  try {
    const { id } = req.params;

    const mealSession = await Meal_Session.findByPk(id, {
      include: [
        {
          model: Meal_Session_Item,
          as: 'sessionItems',
          include: [
            {
              model: Food_Item,
              as: 'foodItem'
            }
          ]
        }
      ]
    });

    if (!mealSession) {
      return res.status(404).json({
        success: false,
        message: 'Meal session not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Meal session retrieved successfully',
      data: mealSession
    });
  } catch (error) {
    console.error('Error fetching meal session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meal session',
      error: error.message
    });
  }
};

/**
 * Update a meal session
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateMealSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, meal_time, start_time, end_time } = req.body;

    const mealSession = await Meal_Session.findByPk(id);

    if (!mealSession) {
      return res.status(404).json({
        success: false,
        message: 'Meal session not found'
      });
    }

    // Validate meal_time if provided
    if (meal_time) {
      const validMealTimes = ['breakfast', 'lunch', 'dinner'];
      if (!validMealTimes.includes(meal_time)) {
        return res.status(400).json({
          success: false,
          message: 'meal_time must be one of: breakfast, lunch, dinner'
        });
      }
    }

    // Validate time format if both times are provided
    if (start_time && end_time) {
      const startTime = new Date(`2000-01-01T${start_time}`);
      const endTime = new Date(`2000-01-01T${end_time}`);
      
      if (startTime >= endTime) {
        return res.status(400).json({
          success: false,
          message: 'start_time must be before end_time'
        });
      }
    }

    // Update only provided fields
    const updateData = {};
    if (date !== undefined) updateData.date = date;
    if (meal_time !== undefined) updateData.meal_time = meal_time;
    if (start_time !== undefined) updateData.start_time = start_time;
    if (end_time !== undefined) updateData.end_time = end_time;

    await mealSession.update(updateData);

    res.status(200).json({
      success: true,
      message: 'Meal session updated successfully',
      data: mealSession
    });
  } catch (error) {
    console.error('Error updating meal session:', error);
    
    // Handle unique constraint violation
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: 'A meal session already exists for this date and meal time'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update meal session',
      error: error.message
    });
  }
};

/**
 * Delete a meal session
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteMealSession = async (req, res) => {
  try {
    const { id } = req.params;

    const mealSession = await Meal_Session.findByPk(id);

    if (!mealSession) {
      return res.status(404).json({
        success: false,
        message: 'Meal session not found'
      });
    }

    await mealSession.destroy();

    res.status(200).json({
      success: true,
      message: 'Meal session deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting meal session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete meal session',
      error: error.message
    });
  }
};

/**
 * Add food items to a meal session
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const addItemsToMealSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { food_items } = req.body; // Array of { food_item_id, available_quantity }

    if (!food_items || !Array.isArray(food_items)) {
      return res.status(400).json({
        success: false,
        message: 'food_items array is required'
      });
    }

    const mealSession = await Meal_Session.findByPk(id);
    if (!mealSession) {
      return res.status(404).json({
        success: false,
        message: 'Meal session not found'
      });
    }

    const sessionItems = [];
    for (const item of food_items) {
      const { food_item_id, available_quantity } = item;
      
      if (!food_item_id) {
        return res.status(400).json({
          success: false,
          message: 'food_item_id is required for each item'
        });
      }

      // Check if food item exists
      const foodItem = await Food_Item.findByPk(food_item_id);
      if (!foodItem) {
        return res.status(404).json({
          success: false,
          message: `Food item with ID ${food_item_id} not found`
        });
      }

      const sessionItem = await Meal_Session_Item.create({
        meal_session_id: id,
        food_item_id,
        available_quantity: available_quantity || null
      });

      sessionItems.push(sessionItem);
    }

    res.status(201).json({
      success: true,
      message: 'Food items added to meal session successfully',
      data: sessionItems
    });
  } catch (error) {
    console.error('Error adding items to meal session:', error);
    
    // Handle unique constraint violation
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: 'One or more food items already exist in this meal session'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to add items to meal session',
      error: error.message
    });
  }
};

module.exports = {
  createMealSession,
  getAllMealSessions,
  getMealSessionById,
  updateMealSession,
  deleteMealSession,
  addItemsToMealSession
};
