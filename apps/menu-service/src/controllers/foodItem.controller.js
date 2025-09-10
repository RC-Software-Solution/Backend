const { Food_Item } = require('../models');

/**
 * Create a new food item
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createFoodItem = async (req, res) => {
  try {
    const { name, description, price, meal_type, image_url } = req.body;

    // Validate required fields
    if (!name || !price || !meal_type) {
      return res.status(400).json({
        success: false,
        message: 'Name, price, and meal_type are required fields'
      });
    }

    // Validate meal_type
    const validMealTypes = ['veg', 'non-veg', 'other'];
    if (!validMealTypes.includes(meal_type)) {
      return res.status(400).json({
        success: false,
        message: 'meal_type must be one of: veg, non-veg, other'
      });
    }

    // Validate price
    if (isNaN(price) || parseFloat(price) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be a positive number'
      });
    }

    const foodItem = await Food_Item.create({
      name,
      description,
      price: parseFloat(price),
      meal_type,
      image_url
    });

    res.status(201).json({
      success: true,
      message: 'Food item created successfully',
      data: foodItem
    });
  } catch (error) {
    console.error('Error creating food item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create food item',
      error: error.message
    });
  }
};

/**
 * Get all food items with pagination
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllFoodItems = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const meal_type = req.query.meal_type;

    // Build where clause
    const whereClause = {};
    if (meal_type) {
      const validMealTypes = ['veg', 'non-veg', 'other'];
      if (validMealTypes.includes(meal_type)) {
        whereClause.meal_type = meal_type;
      }
    }

    const { count, rows } = await Food_Item.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      success: true,
      message: 'Food items retrieved successfully',
      data: {
        foodItems: rows,
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
    console.error('Error fetching food items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch food items',
      error: error.message
    });
  }
};

/**
 * Get a single food item by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getFoodItemById = async (req, res) => {
  try {
    const { id } = req.params;

    const foodItem = await Food_Item.findByPk(id);

    if (!foodItem) {
      return res.status(404).json({
        success: false,
        message: 'Food item not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Food item retrieved successfully',
      data: foodItem
    });
  } catch (error) {
    console.error('Error fetching food item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch food item',
      error: error.message
    });
  }
};

/**
 * Update a food item
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateFoodItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, meal_type, image_url } = req.body;

    const foodItem = await Food_Item.findByPk(id);

    if (!foodItem) {
      return res.status(404).json({
        success: false,
        message: 'Food item not found'
      });
    }

    // Validate meal_type if provided
    if (meal_type) {
      const validMealTypes = ['veg', 'non-veg', 'other'];
      if (!validMealTypes.includes(meal_type)) {
        return res.status(400).json({
          success: false,
          message: 'meal_type must be one of: veg, non-veg, other'
        });
      }
    }

    // Validate price if provided
    if (price !== undefined) {
      if (isNaN(price) || parseFloat(price) <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Price must be a positive number'
        });
      }
    }

    // Update only provided fields
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (meal_type !== undefined) updateData.meal_type = meal_type;
    if (image_url !== undefined) updateData.image_url = image_url;

    await foodItem.update(updateData);

    res.status(200).json({
      success: true,
      message: 'Food item updated successfully',
      data: foodItem
    });
  } catch (error) {
    console.error('Error updating food item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update food item',
      error: error.message
    });
  }
};

/**
 * Delete a food item
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteFoodItem = async (req, res) => {
  try {
    const { id } = req.params;

    const foodItem = await Food_Item.findByPk(id);

    if (!foodItem) {
      return res.status(404).json({
        success: false,
        message: 'Food item not found'
      });
    }

    await foodItem.destroy();

    res.status(200).json({
      success: true,
      message: 'Food item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting food item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete food item',
      error: error.message
    });
  }
};

module.exports = {
  createFoodItem,
  getAllFoodItems,
  getFoodItemById,
  updateFoodItem,
  deleteFoodItem
};
