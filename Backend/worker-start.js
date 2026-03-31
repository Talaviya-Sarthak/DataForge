require('dotenv').config();

const { trainingWorker } = require('./workers/training.worker');
const { cleanupWorker } = require('./workers/cleanup.worker');
const { setupCleanupJob } = require('./queues/cleanup.queue');
const logger = require('./utils/logger');

// ═══════════════════════════════════════════════════════════════════════════════
// WORKER STARTUP
// ═══════════════════════════════════════════════════════════════════════════════
// This script starts:
// 1. Training Worker - Processes ML training jobs
// 2. Cleanup Worker - Deletes expired models (runs every hour)
//
// Note: BullMQ Workers automatically handle stalled job detection and recovery
// without needing a separate QueueScheduler process.
// ═══════════════════════════════════════════════════════════════════════════════

const concurrency = parseInt(process.env.WORKER_CONCURRENCY || '2', 10);

logger.info('[WORKER]', 'Starting workers...', {
  redis: `${process.env.REDIS_HOST || '127.0.0.1'}:${process.env.REDIS_PORT || '6379'}`,
  concurrency,
  stalledRecovery: 'enabled',
});

// Setup cleanup repeatable job
setupCleanupJob().catch((err) => {
  logger.error('[WORKER]', 'Failed to setup cleanup job', { error: err.message });
});

logger.info('[WORKER]', '✅ Training worker ready');
logger.info('[WORKER]', '✅ Cleanup worker ready (runs every hour)');
logger.info('[WORKER]', 'Listening for jobs...');

// ─────────────────────────────────────────────────────────────────────────────
// GRACEFUL SHUTDOWN
// ─────────────────────────────────────────────────────────────────────────────

process.on('SIGTERM', async () => {
  logger.warn('[WORKER]', 'SIGTERM received, initiating graceful shutdown...');
  try {
    await Promise.all([
      trainingWorker.close(),
      cleanupWorker.close(),
    ]);
    logger.info('[WORKER]', '✅ All workers closed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('[WORKER]', 'Error during shutdown', { error: error.message });
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  logger.warn('[WORKER]', 'SIGINT received, initiating graceful shutdown...');
  try {
    await Promise.all([
      trainingWorker.close(),
      cleanupWorker.close(),
    ]);
    logger.info('[WORKER]', '✅ All workers closed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('[WORKER]', 'Error during shutdown', { error: error.message });
    process.exit(1);
  }
});

process.on('uncaughtException', (error) => {
  logger.error('[WORKER]', 'Uncaught exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('[WORKER]', 'Unhandled rejection', { reason: String(reason) });
  process.exit(1);
});
