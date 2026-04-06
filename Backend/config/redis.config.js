const IORedis = require('ioredis');

// Redis connection configuration
const redisConfig = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  maxRetriesPerRequest: null, // Required for BullMQ
  enableReadyCheck: false,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
};

// Create Redis connection instance
const connection = new IORedis(redisConfig);

// Connection event handlers
connection.on('connect', () => {
});

connection.on('error', (err) => {
});

connection.on('close', () => {
});

module.exports = { connection, redisConfig };
