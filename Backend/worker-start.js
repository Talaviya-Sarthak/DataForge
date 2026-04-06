require('dotenv').config();

const { trainingWorker } = require('./workers/training.worker');
const { cleanupWorker } = require('./workers/cleanup.worker');
const { setupCleanupJob } = require('./queues/cleanup.queue');

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


// Setup cleanup repeatable job
setupCleanupJob().catch((err) => {
});


// ─────────────────────────────────────────────────────────────────────────────
// GRACEFUL SHUTDOWN
// ─────────────────────────────────────────────────────────────────────────────

process.on('SIGTERM', async () => {
  try {
    await Promise.all([
      trainingWorker.close(),
      cleanupWorker.close(),
    ]);
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  try {
    await Promise.all([
      trainingWorker.close(),
      cleanupWorker.close(),
    ]);
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
});

process.on('uncaughtException', (error) => {
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  process.exit(1);
});
