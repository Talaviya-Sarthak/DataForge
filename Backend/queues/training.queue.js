const { Queue } = require('bullmq');
const { connection } = require('../config/redis.config');
const logger = require('../utils/logger');

const trainingQueue = new Queue('training-queue', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: {
      age: 86400,
      count: 100,
    },
    removeOnFail: {
      age: 604800,
      count: 500,
    },
  },
});

trainingQueue.on('error', (err) => {
  logger.error('[QUEUE]', 'Training queue error', { error: err.message });
});

logger.info('[QUEUE]', 'Queue initialized', {
  name: trainingQueue.name,
  attempts: 3,
  backoff: 'exponential',
});

module.exports = { trainingQueue };
