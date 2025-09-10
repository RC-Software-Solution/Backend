const Food_Item = require('./Food_Items');
const Meal_Session = require('./Meal_Session');
const Meal_Session_Item = require('./Meal_Session_Items');

// Define associations
Meal_Session.hasMany(Meal_Session_Item, {
    foreignKey: 'meal_session_id',
    as: 'sessionItems'
});

Food_Item.hasMany(Meal_Session_Item, {
    foreignKey: 'food_item_id',
    as: 'sessionItems'
});

Meal_Session_Item.belongsTo(Meal_Session, {
    foreignKey: 'meal_session_id',
    as: 'mealSession'
});

Meal_Session_Item.belongsTo(Food_Item, {
    foreignKey: 'food_item_id',
    as: 'foodItem'
});

// Many-to-many relationship through Meal_Session_Item
Meal_Session.belongsToMany(Food_Item, {
    through: Meal_Session_Item,
    foreignKey: 'meal_session_id',
    otherKey: 'food_item_id',
    as: 'foodItems'
});

Food_Item.belongsToMany(Meal_Session, {
    through: Meal_Session_Item,
    foreignKey: 'food_item_id',
    otherKey: 'meal_session_id',
    as: 'mealSessions'
});

module.exports = {
    Food_Item,
    Meal_Session,
    Meal_Session_Item
};
