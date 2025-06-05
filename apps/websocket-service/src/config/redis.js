const Redis = require('ioredis');
require('dotenv').config();

const subscriber = new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
});

subscriber.on('connect', () => {
    console.log('Connected to Redis subscriber');   
})

module.exports = {subscriber};