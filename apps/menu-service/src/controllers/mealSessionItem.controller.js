const { Meal_Session_Item, Meal_Session, Food_Item } = require('../models');
const { emitInventoryUpdate } = require('../ws/emitter');
const { DateTime } = require('luxon');

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

// Helper function to check if current time is within session window (handles cross-day sessions)
const isSessionAvailable = (sessionDate, startTime, endTime) => {
  const now = DateTime.now().setZone('Asia/Colombo');
  
  console.log('\n========================================');
  console.log('SESSION AVAILABILITY CHECK');
  console.log('========================================');
  console.log('Input Parameters:');
  console.log('  sessionDate (meal date):', sessionDate);
  console.log('  startTime:', startTime);
  console.log('  endTime:', endTime);
  console.log('');
  
  // Parse end time on the session date
  const sessionEnd = DateTime.fromISO(`${sessionDate}T${endTime}`, { zone: 'Asia/Colombo' });
  
  let sessionStart;
  // If end_time < start_time, it's a cross-day session
  // Ordering starts the PREVIOUS day
  if (endTime < startTime) {
    console.log('⚠️  Cross-day ordering window detected');
    const prevDate = DateTime.fromISO(sessionDate, { zone: 'Asia/Colombo' })
      .minus({ days: 1 })
      .toISODate();
    sessionStart = DateTime.fromISO(`${prevDate}T${startTime}`, { zone: 'Asia/Colombo' });
    console.log('  Ordering starts previous day:', prevDate);
  } else {
    sessionStart = DateTime.fromISO(`${sessionDate}T${startTime}`, { zone: 'Asia/Colombo' });
  }
  
  console.log('Current & Session Times (Sri Lankan):');
  console.log('  Current Time:', now.toFormat('yyyy-MM-dd HH:mm:ss'));
  console.log('  Ordering Opens:', sessionStart.toFormat('yyyy-MM-dd HH:mm:ss'));
  console.log('  Ordering Closes:', sessionEnd.toFormat('yyyy-MM-dd HH:mm:ss'));
  console.log('');
  
  const isAfterStart = now >= sessionStart;
  const isBeforeEnd = now <= sessionEnd;
  const isAvailable = isAfterStart && isBeforeEnd;
  
  console.log('Comparison Results:');
  console.log('  Now >= Start?', isAfterStart);
  console.log('  Now <= End?', isBeforeEnd);
  console.log('  Is Available?', isAvailable);
  
  if (!isAvailable) {
    console.log('\n❌ Session NOT Available');
    if (!isAfterStart) {
      const diff = sessionStart.diff(now, ['hours', 'minutes']).toObject();
      console.log(`  Ordering opens in: ${Math.floor(diff.hours)}h ${Math.floor(diff.minutes)}m`);
    }
    if (!isBeforeEnd && isAfterStart) {
      const diff = now.diff(sessionEnd, ['hours', 'minutes']).toObject();
      console.log(`  Ordering closed: ${Math.floor(diff.hours)}h ${Math.floor(diff.minutes)}m ago`);
    }
  } else {
    console.log('\n✅ Session IS Available for Ordering');
  }
  
  console.log('========================================\n');
  
  return isAvailable;
};
// List items for a session by meal_time and date
const listMealSessionItemsByTime = async (req, res) => {
  try {
    const { meal_time, date, check_availability } = req.query;
    
    if (!meal_time || !date) {
      return res.status(400).json({ 
        success: false, 
        message: 'meal_time and date query parameters are required' 
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

    // Find the meal session first
    const mealSession = await Meal_Session.findOne({
      where: { meal_time, date }
    });

    if (!mealSession) {
      return res.status(404).json({
        success: false,
        message: 'Meal session not found for the given meal_time and date'
      });
    }

    // Check if session is currently available (if requested)
    let sessionAvailable = true;
    if (check_availability === 'true') {
      sessionAvailable = isSessionAvailable(date, mealSession.start_time, mealSession.end_time);
      
      if (!sessionAvailable) {
        return res.status(400).json({
          success: false,
          message: 'Meal session is not currently available for ordering',
          session: {
            id: mealSession.id,
            meal_time: mealSession.meal_time,
            date: mealSession.date,
            start_time: mealSession.start_time,
            end_time: mealSession.end_time,
            available: false
          }
        });
      }
    }

    // Get session items with food item details
    const items = await Meal_Session_Item.findAll({
      where: { meal_session_id: mealSession.id },
      include: [{ model: Food_Item, as: 'foodItem' }]
    });

    res.status(200).json({ 
      success: true, 
      data: items,
      session: {
        id: mealSession.id,
        meal_time: mealSession.meal_time,
        date: mealSession.date,
        start_time: mealSession.start_time,
        end_time: mealSession.end_time,
        available: sessionAvailable
      }
    });
  } catch (error) {
    console.error('listMealSessionItemsByTime error', error);
    res.status(500).json({ success: false, message: 'Failed to fetch session items' });
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
  listMealSessionItemsByTime,
  updateMealSessionItem,
  deleteMealSessionItem
};


