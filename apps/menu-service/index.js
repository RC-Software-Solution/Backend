const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const foodItemRoutes = require('./src/routes/foodItem.routes');
const inventoryRoutes = require('./src/routes/inventory.routes');
const mealSessionRoutes = require('./src/routes/mealSession.routes');
const mealSessionItemRoutes = require('./src/routes/mealSessionItem.routes');
const { setInventoryBroadcaster } = require('./src/ws/emitter');

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/food-items', foodItemRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/meal-sessions', mealSessionRoutes);
app.use('/api/meal-session-items', mealSessionItemRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    service: 'menu-service',
    timestamp: new Date().toISOString()
  });
});

const server = http.createServer(app);
// remember to adjust cors for security in production ==================
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const clients = new Set();

io.on("connection", (socket) => {
    console.log("Client connected", socket.id);
    clients.add(socket);

    socket.on("disconnect", () => {
        console.log("Client disconnected", socket.id);
        clients.delete(socket);
    });
});

function broadcastMealSessionUpdate(update) {
    // update should include: meal_session_id, food_item_id, available_quantity
    io.emit("mealSessionItemUpdate", {
        meal_session_id: update.meal_session_id,
        food_item_id: update.food_item_id,
        available_quantity: update.available_quantity
    });
}

const PORT = process.env.PORT || 4005;
server.listen(PORT, () => console.log(`Menu Service running on port ${PORT}`));

// expose broadcaster to other modules
setInventoryBroadcaster(broadcastMealSessionUpdate);

module.exports = { app, io, broadcastMealSessionUpdate};