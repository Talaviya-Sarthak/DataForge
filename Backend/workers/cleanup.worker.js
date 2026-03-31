require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const { Worker } = require('bullmq');
const { connection } = require('../config/redis.config');
const cleanupService = require('../services/cleanup.service');
const logger = require('../utils/logger');

// ═══════════════════════════════════════════════════════════════════════════════
// CLEANUP WORKER
// ═══════════════════════════════════════════════════════════════════════════════
// Processes cleanup jobs to delete expired models
// Runs every hour via repeatable job
// ═══════════════════════════════════════════════════════════════════════════════

const cleanupWorker = new Worker(
  'cleanup-queue',
  async (job) => {
    logger.info('[CLEANUP-WORKER]', '🧹 Starting cleanup job', {
      job_id: job.id,
      timestamp: new Date().toISOString(),
    });

    try {
      const result = await cleanupService.deleteExpiredModels();

      logger.info('[CLEANUP-WORKER]', '✅ Cleanup job completed', {
        job_id: job.id,
        deleted: result.deleted,
        failed: result.failed,
        total: result.total,
      });

      return result;
    } catch (error) {
      logger.error('[CLEANUP-WORKER]', '❌ Cleanup job failed', {
        job_id: job.id,
        error: error.message,
      });
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
  logger.info('[CLEANUP-WORKER]', '⚡ Cleanup job started', { job_id: job.id });
});

cleanupWorker.on('completed', (job, result) => {
  logger.info('[CLEANUP-WORKER]', '🔓 Cleanup job finished', {
    job_id: job.id,
    deleted: result?.deleted || 0,
  });
});

cleanupWorker.on('failed', (job, err) => {
  logger.error('[CLEANUP-WORKER]', '💀 Cleanup job failed', {
    job_id: job?.id,
    error: err.message,
  });
});

cleanupWorker.on('error', (err) => {
  logger.error('[CLEANUP-WORKER]', 'Worker error', { error: err.message });
});

// ─────────────────────────────────────────────────────────────────────────────
// GRACEFUL SHUTDOWN
// ─────────────────────────────────────────────────────────────────────────────

process.on('SIGTERM', async () => {
  logger.warn('[CLEANUP-WORKER]', 'SIGTERM received, closing worker...');
  await cleanupWorker.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.warn('[CLEANUP-WORKER]', 'SIGINT received, closing worker...');
  await cleanupWorker.close();
  process.exit(0);
});

logger.info('[CLEANUP-WORKER]', '✅ Cleanup worker initialized');

module.exports = { cleanupWorker };
