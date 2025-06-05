const WebSocket = require('ws');

const clients = new Set();

function initWebSocketServer(server) {
    const wss = new WebSocket.Server({server});

    wss.on('connection', (ws) => {
        clients.add(ws);
        console.log('Client connected. Total:', clients.size);

        ws.on('close', () => {
            clients.delete(ws);
            console.log('Client disconnected. Total:', clients.size);
        });
    });
}

function broadcast(data) {
    for(const client of clients) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    }
}

module.exports = { initWebSocketServer, broadcast };