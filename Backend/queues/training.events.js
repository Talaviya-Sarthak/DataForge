const { QueueEvents } = require('bullmq');
const { connection } = require('../config/redis.config');

const trainingQueueEvents = new QueueEvents('training-queue', { connection });

trainingQueueEvents.on('waiting',           ({ jobId })              => null); // Suppress
trainingQueueEvents.on('progress',          ({ jobId, data })        => null); // Suppress progress updates


module.exports = { trainingQueueEvents };
