const { Queue } = require('bullmq');
const { connection } = require('../config/redis.config');

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
});

trainingQueue.on('stalled', (jobId, prevError) => {
});

trainingQueue.on('failed', (job, err) => {
});

trainingQueue.on('completed', (job) => {
});


module.exports = { trainingQueue };
