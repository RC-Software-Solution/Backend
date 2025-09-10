const { decrementAvailability, incrementAvailability } = require('../services/inventoryService');
const { emitInventoryUpdate } = require('../ws/emitter');

/**
 * Decrement availability for a session item
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const decrementItemAvailability = async (req, res) => {
  try {
    const { meal_session_id, food_item_id, quantity } = req.body;
    
    if (!meal_session_id || !food_item_id) {
      return res.status(400).json({ 
        success: false,
        error: 'meal_session_id and food_item_id are required' 
      });
    }
    
    const qty = Number(quantity) || 1;
    if (qty <= 0) {
      return res.status(400).json({ 
        success: false,
        error: 'quantity must be positive' 
      });
    }

    const updated = await decrementAvailability(meal_session_id, food_item_id, qty);
    emitInventoryUpdate({
      meal_session_id,
      food_item_id,
      available_quantity: updated.available_quantity
    });
    
    res.status(200).json({ 
      success: true, 
      message: 'Availability decremented successfully',
      data: updated 
    });
  } catch (error) {
    if (error.message === 'Insufficient quantity') {
      return res.status(409).json({ 
        success: false,
        error: 'Insufficient quantity' 
      });
    }
    console.error('Decrement availability error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to decrement availability' 
    });
  }
};

/**
 * Increment availability for a session item
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const incrementItemAvailability = async (req, res) => {
  try {
    const { meal_session_id, food_item_id, quantity } = req.body;
    
    if (!meal_session_id || !food_item_id) {
      return res.status(400).json({ 
        success: false,
        error: 'meal_session_id and food_item_id are required' 
      });
    }
    
    const qty = Number(quantity) || 1;
    if (qty <= 0) {
      return res.status(400).json({ 
        success: false,
        error: 'quantity must be positive' 
      });
    }

    const updated = await incrementAvailability(meal_session_id, food_item_id, qty);
    emitInventoryUpdate({
      meal_session_id,
      food_item_id,
      available_quantity: updated.available_quantity
    });
    
    res.status(200).json({ 
      success: true, 
      message: 'Availability incremented successfully',
      data: updated 
    });
  } catch (error) {
    console.error('Increment availability error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to increment availability' 
    });
  }
};

module.exports = {
  decrementItemAvailability,
  incrementItemAvailability
};
