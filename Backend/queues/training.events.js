const { QueueEvents } = require('bullmq');
const { connection } = require('../config/redis.config');
const logger = require('../utils/logger');

const trainingQueueEvents = new QueueEvents('training-queue', { connection });

trainingQueueEvents.on('added',             ({ jobId })              => logger.info('[QUEUE]',  'Job added',             { jobId }));
trainingQueueEvents.on('waiting',           ({ jobId })              => logger.debug('[QUEUE]', 'Job waiting',           { jobId }));
trainingQueueEvents.on('active',            ({ jobId })              => logger.info('[WORKER]', 'Job started',           { jobId }));
trainingQueueEvents.on('progress',          ({ jobId, data })        => logger.info('[WORKER]', 'Job progress',          { jobId, progress: data }));
trainingQueueEvents.on('completed',         ({ jobId })              => logger.info('[WORKER]', 'Job completed',         { jobId }));
trainingQueueEvents.on('failed',            ({ jobId, failedReason })=> logger.error('[WORKER]','Job failed',            { jobId, reason: failedReason }));
trainingQueueEvents.on('delayed',           ({ jobId, delay })       => logger.warn('[QUEUE]',  'Job delayed',           { jobId, delay }));
trainingQueueEvents.on('retries-exhausted', ({ jobId })              => logger.error('[QUEUE]', 'Retries exhausted',     { jobId }));

trainingQueueEvents.on('error', (err) => logger.error('[QUEUE]', 'QueueEvents error', { error: err.message }));

module.exports = { trainingQueueEvents };
