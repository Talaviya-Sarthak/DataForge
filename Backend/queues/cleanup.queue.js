const { Queue } = require('bullmq');
const { connection } = require('../config/redis.config');
const logger = require('../utils/logger');

// ═══════════════════════════════════════════════════════════════════════════════
// CLEANUP QUEUE
// ═══════════════════════════════════════════════════════════════════════════════
// Handles automatic deletion of expired models
// Runs every hour to clean up models older than 5 days
// ═══════════════════════════════════════════════════════════════════════════════

const cleanupQueue = new Queue('cleanup-queue', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 10000, // 10s, 20s, 40s
    },
    removeOnComplete: {
      age: 86400, // Keep completed jobs for 24 hours
      count: 100,
    },
    removeOnFail: {
      age: 604800, // Keep failed jobs for 7 days
      count: 500,
    },
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// SETUP REPEATABLE JOB (runs every hour)
// ─────────────────────────────────────────────────────────────────────────────

const setupCleanupJob = async () => {
  try {
    // Remove any existing repeatable jobs first
    const repeatableJobs = await cleanupQueue.getRepeatableJobs();
    for (const job of repeatableJobs) {
      await cleanupQueue.removeRepeatableByKey(job.key);
    }

    // Add new repeatable job - runs every hour
    await cleanupQueue.add(
      'delete-expired-models',
      {},
      {
        repeat: {
          pattern: '0 * * * *', // Every hour at minute 0
        },
        jobId: 'cleanup-expired-models', // Unique ID to prevent duplicates
      }
    );

    logger.info('[CLEANUP-QUEUE]', '✅ Cleanup job scheduled (runs every hour)');
  } catch (error) {
    logger.error('[CLEANUP-QUEUE]', 'Failed to setup cleanup job', { error: error.message });
    throw error;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// QUEUE EVENT HANDLERS
// ─────────────────────────────────────────────────────────────────────────────

cleanupQueue.on('error', (err) => {
  logger.error('[CLEANUP-QUEUE]', 'Queue error', { error: err.message });
});

cleanupQueue.on('completed', (job, result) => {
  logger.info('[CLEANUP-QUEUE]', 'Cleanup job completed', {
    job_id: job.id,
    deleted: result?.deleted || 0,
    failed: result?.failed || 0,
  });
});

cleanupQueue.on('failed', (job, err) => {
  logger.error('[CLEANUP-QUEUE]', 'Cleanup job failed', {
    job_id: job?.id,
    error: err.message,
  });
});

logger.info('[CLEANUP-QUEUE]', '✅ Cleanup queue initialized');

module.exports = { cleanupQueue, setupCleanupJob };
