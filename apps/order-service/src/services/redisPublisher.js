const Redis = require('ioredis');
require('dotenv').config();


const redis = new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
});

function publishOrderUpdate(data){
    console.log('Publishing order update:', data);
    redis.publish('order_updates', JSON.stringify(data));
}

module.exports = { publishOrderUpdate };