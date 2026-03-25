require('dotenv').config();

const { trainingWorker } = require('./workers/training.worker');
const logger = require('./utils/logger');

// ═══════════════════════════════════════════════════════════════════════════════
// WORKER STARTUP
// ═══════════════════════════════════════════════════════════════════════════════
// This script starts the Training Worker which:
// 1. Processes jobs from the queue
// 2. Handles stalled job recovery (via maxStalledCount configuration)
// 3. Manages long-running ML training tasks
//
// Note: BullMQ Workers automatically handle stalled job detection and recovery
// without needing a separate QueueScheduler process.
// ═══════════════════════════════════════════════════════════════════════════════

const concurrency = parseInt(process.env.WORKER_CONCURRENCY || '2', 10);

logger.info('[WORKER]', 'Starting training worker...', {
  redis: `${process.env.REDIS_HOST || '127.0.0.1'}:${process.env.REDIS_PORT || '6379'}`,
  concurrency,
  stalledRecovery: 'enabled',
});

logger.info('[WORKER]', '✅ Training worker ready');
logger.info('[WORKER]', 'Listening for training jobs on "training-queue"...');

// ─────────────────────────────────────────────────────────────────────────────
// GRACEFUL SHUTDOWN
// ─────────────────────────────────────────────────────────────────────────────

process.on('SIGTERM', async () => {
  logger.warn('[WORKER]', 'SIGTERM received, initiating graceful shutdown...');
  try {
    await trainingWorker.close();
    logger.info('[WORKER]', '✅ Worker closed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('[WORKER]', 'Error during shutdown', { error: error.message });
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  logger.warn('[WORKER]', 'SIGINT received, initiating graceful shutdown...');
  try {
    await trainingWorker.close();
    logger.info('[WORKER]', '✅ Worker closed successfully');
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
