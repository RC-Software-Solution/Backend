const { Sequelize } = require('sequelize');
const sequelize = require('../config/database');
const { Meal_Session_Item } = require('../models');

/**
 * Atomically decrease available_quantity for a session item.
 * Returns updated row or throws on insufficient quantity.
 */
async function decrementAvailability(mealSessionId, foodItemId, quantity = 1) {
  return await sequelize.transaction(async (t) => {
    const [updatedCount] = await Meal_Session_Item.update(
      { available_quantity: Sequelize.literal(`GREATEST(available_quantity - ${quantity}, 0)`) },
      {
        where: {
          meal_session_id: mealSessionId,
          food_item_id: foodItemId,
          available_quantity: { [Sequelize.Op.gte]: quantity }
        },
        transaction: t
      }
    );

    if (updatedCount === 0) {
      throw new Error('Insufficient quantity');
    }

    const updated = await Meal_Session_Item.findOne({
      where: { meal_session_id: mealSessionId, food_item_id: foodItemId },
      transaction: t
    });
    return updated;
  });
}

/**
 * Atomically increase available_quantity (e.g., on order cancel/refund)
 */
async function incrementAvailability(mealSessionId, foodItemId, quantity = 1) {
  return await sequelize.transaction(async (t) => {
    await Meal_Session_Item.increment(
      { available_quantity: quantity },
      {
        where: { meal_session_id: mealSessionId, food_item_id: foodItemId },
        transaction: t
      }
    );

    const updated = await Meal_Session_Item.findOne({
      where: { meal_session_id: mealSessionId, food_item_id: foodItemId },
      transaction: t
    });
    return updated;
  });
}

module.exports = {
  decrementAvailability,
  incrementAvailability
};


