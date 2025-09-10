const { Meal_Session_Item, Meal_Session, Food_Item } = require('../models');
const { emitInventoryUpdate } = require('../ws/emitter');

// Create or upsert a meal session item
const createMealSessionItem = async (req, res) => {
  try {
    const { meal_session_id, food_item_id, available_quantity } = req.body;

    if (!meal_session_id || !food_item_id) {
      return res.status(400).json({ success: false, message: 'meal_session_id and food_item_id are required' });
    }

    // Ensure parent records exist
    const [session, item] = await Promise.all([
      Meal_Session.findByPk(meal_session_id),
      Food_Item.findByPk(food_item_id)
    ]);
    if (!session) return res.status(404).json({ success: false, message: 'Meal session not found' });
    if (!item) return res.status(404).json({ success: false, message: 'Food item not found' });

    const created = await Meal_Session_Item.create({
      meal_session_id,
      food_item_id,
      available_quantity: available_quantity ?? null
    });

    emitInventoryUpdate({
      meal_session_id,
      food_item_id,
      available_quantity: created.available_quantity
    });

    res.status(201).json({ success: true, message: 'Session item created', data: created });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ success: false, message: 'This food item already exists in the session' });
    }
    console.error('createMealSessionItem error', error);
    res.status(500).json({ success: false, message: 'Failed to create session item' });
  }
};

// List items for a session
const listMealSessionItems = async (req, res) => {
  try {
    const { meal_session_id } = req.params;
    const items = await Meal_Session_Item.findAll({
      where: { meal_session_id },
      include: [{ model: Food_Item, as: 'foodItem' }]
    });
    res.json({ success: true, data: items });
  } catch (error) {
    console.error('listMealSessionItems error', error);
    res.status(500).json({ success: false, message: 'Failed to fetch session items' });
  }
};

// Update a session item
const updateMealSessionItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { available_quantity } = req.body;
    const sessionItem = await Meal_Session_Item.findByPk(id);
    if (!sessionItem) return res.status(404).json({ success: false, message: 'Session item not found' });

    await sessionItem.update({ available_quantity });
    emitInventoryUpdate({
      meal_session_id: sessionItem.meal_session_id,
      food_item_id: sessionItem.food_item_id,
      available_quantity: sessionItem.available_quantity
    });
    res.json({ success: true, message: 'Session item updated', data: sessionItem });
  } catch (error) {
    console.error('updateMealSessionItem error', error);
    res.status(500).json({ success: false, message: 'Failed to update session item' });
  }
};

// Delete a session item
const deleteMealSessionItem = async (req, res) => {
  try {
    const { id } = req.params;
    const sessionItem = await Meal_Session_Item.findByPk(id);
    if (!sessionItem) return res.status(404).json({ success: false, message: 'Session item not found' });

    const payload = {
      meal_session_id: sessionItem.meal_session_id,
      food_item_id: sessionItem.food_item_id,
      available_quantity: 0
    };
    await sessionItem.destroy();
    emitInventoryUpdate(payload);
    res.json({ success: true, message: 'Session item deleted' });
  } catch (error) {
    console.error('deleteMealSessionItem error', error);
    res.status(500).json({ success: false, message: 'Failed to delete session item' });
  }
};

module.exports = {
  createMealSessionItem,
  listMealSessionItems,
  updateMealSessionItem,
  deleteMealSessionItem
};


