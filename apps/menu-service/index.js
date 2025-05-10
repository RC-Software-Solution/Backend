const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const sequelize = require('sequelize');
const MealSession = require("./src/models/Meal_Session")
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
// remeber to adjust cors for security in production ==================
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

function broadcastMealSessionUpdate(mealSession) {
    io.emit("mealSessionUpdate", {
        meal_time: mealSession.meal_time,
        remaining_orders: mealSession.order_limit-mealSession.current_orders,
    });
}

const PORT = process.env.PORT || 4003;
server.listen(PORT, () => console.log(`Menu Service running on port ${PORT}`));

module.exports = { app, io, broadcastMealSessionUpdate};