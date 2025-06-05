const express = require('express');
const http = require('http');
require('dotenv').config();

const { initWebSocketServer, broadcast } = require('./src/ws/server');
const { subscriber } = require('./src/config/redis');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 4008;

initWebSocketServer(server);

subscriber.subscribe('order_updates');
subscriber.on('message', (_, message) => {
    console.log('Broadcasting:', message);
    broadcast(message);
});

server.listen(PORT, () => {
    console.log(`WebSocket Service running on port ${PORT}`)
})

