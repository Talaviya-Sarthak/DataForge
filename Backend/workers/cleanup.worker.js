require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const { Worker } = require('bullmq');
const { connection } = require('../config/redis.config');
const cleanupService = require('../services/cleanup.service');

// ═══════════════════════════════════════════════════════════════════════════════
// CLEANUP WORKER
// ═══════════════════════════════════════════════════════════════════════════════
// Processes cleanup jobs to delete expired models
// Runs every hour via repeatable job
// ═══════════════════════════════════════════════════════════════════════════════

const cleanupWorker = new Worker(
  'cleanup-queue',
  async (job) => {

    try {
      const result = await cleanupService.deleteExpiredModels();


      return result;
    } catch (error) {
      throw error;
    }
  },
  {
    connection,
    concurrency: 1, // Only one cleanup job at a time
    lockDuration: 10 * 60 * 1000, // 10 minutes lock
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// WORKER LIFECYCLE EVENTS
// ─────────────────────────────────────────────────────────────────────────────

cleanupWorker.on('active', (job) => {
});

cleanupWorker.on('completed', (job, result) => {
});

cleanupWorker.on('failed', (job, err) => {
});

cleanupWorker.on('error', (err) => {
});

// ─────────────────────────────────────────────────────────────────────────────
// GRACEFUL SHUTDOWN
// ─────────────────────────────────────────────────────────────────────────────

process.on('SIGTERM', async () => {
  await cleanupWorker.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await cleanupWorker.close();
  process.exit(0);
});


module.exports = { cleanupWorker };
