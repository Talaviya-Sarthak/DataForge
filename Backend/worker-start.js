require('dotenv').config();

const { trainingWorker } = require('./workers/training.worker');
const { tuningWorker } = require('./workers/tuning.worker');
const { trainingQueueEvents } = require('./queues/training.events');
const logger = require('./utils/logger');

const concurrency = parseInt(process.env.WORKER_CONCURRENCY || '2', 10);

logger.info('[WORKER]', 'Workers starting', {
  redis: `${process.env.REDIS_HOST || '127.0.0.1'}:${process.env.REDIS_PORT || '6379'}`,
  concurrency,
});
logger.info('[WORKER]', 'Training + Tuning workers ready — listening for jobs');

process.on('SIGTERM', async () => {
  logger.warn('[WORKER]', 'SIGTERM received, shutting down gracefully...');
  await Promise.all([trainingWorker.close(), tuningWorker.close()]);
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.warn('[WORKER]', 'SIGINT received, shutting down gracefully...');
  await Promise.all([trainingWorker.close(), tuningWorker.close()]);
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  logger.error('[WORKER]', 'Uncaught exception', { error: error.message });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('[WORKER]', 'Unhandled rejection', { reason: String(reason) });
  process.exit(1);
});
