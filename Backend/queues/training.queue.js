const { Queue } = require('bullmq');
const { connection } = require('../config/redis.config');
const logger = require('../utils/logger');

// ═══════════════════════════════════════════════════════════════════════════════
// TRAINING QUEUE
// ═══════════════════════════════════════════════════════════════════════════════
// Production-ready configuration with:
// - Automatic stalled job recovery (handled by Worker with maxStalledCount)
// - Proper job lifecycle management
// - Long lock duration for extended ML training (20 minutes)
// - Clean job history
// ═══════════════════════════════════════════════════════════════════════════════

const trainingQueue = new Queue('training-queue', {
  connection,
  defaultJobOptions: {
    // Retry configuration: allow 2 retries (3 total attempts)
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000, // Start with 5s, then 10s, then 20s
    },
    // Remove completed jobs after 24 hours or max 1000 jobs
    removeOnComplete: {
      age: 86400,
      count: 1000,
    },
    // Keep failed jobs for 7 days for debugging
    removeOnFail: {
      age: 604800,
      count: 5000,
    },
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// QUEUE EVENT HANDLERS (Logging & Monitoring)
// ─────────────────────────────────────────────────────────────────────────────

trainingQueue.on('error', (err) => {
  logger.error('[QUEUE]', 'Queue error', { error: err.message });
});

trainingQueue.on('stalled', (jobId, prevError) => {
  logger.warn('[QUEUE]', 'Job stalled (will be recovered by worker)', {
    job_id: jobId,
    prev_error: prevError?.message || 'unknown',
  });
});

trainingQueue.on('failed', (job, err) => {
  logger.error('[QUEUE]', 'Job failed after all retries', {
    job_id: job.id,
    experiment_id: job.data?.experiment_id,
    attempts: job.attemptsMade,
    error: err.message,
  });
});

trainingQueue.on('completed', (job) => {
  logger.info('[QUEUE]', 'Job completed', {
    job_id: job.id,
    experiment_id: job.data?.experiment_id,
    duration_ms: job.finishedOn - job.processedOn,
  });
});

logger.info('[QUEUE]', '✅ Training queue initialized', {
  name: trainingQueue.name,
  attempts: 3,
  backoff: 'exponential',
  removeOnComplete: '24h',
  stalledRecovery: 'enabled (via Worker)',
});

module.exports = { trainingQueue };
