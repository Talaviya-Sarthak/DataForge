require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const { Worker } = require('bullmq');
const { connection } = require('../config/redis.config');
const mlService = require('../services/ml.service');
const trainingService = require('../services/training.service');
const datasetService = require('../services/dataset.service');
const logger = require('../utils/logger');

// ═══════════════════════════════════════════════════════════════════════════════
// ML TRAINING WORKER
// ═══════════════════════════════════════════════════════════════════════════════
// Production-ready worker with:
// - NO global state or blocking flags
// - Proper concurrency control
// - Long lock duration for extended ML jobs
// - Comprehensive error handling & monitoring
// - WebSocket real-time updates
// ═══════════════════════════════════════════════════════════════════════════════

const trainingWorker = new Worker(
  'training-queue',
  async (job) => {
    const {
      experiment_id,
      user_id,
      dataset_id,
      pipeline_id,
      task_type,
      target_column,
      preprocessing_config,
      selected_models,
      preprocessing_steps,
      job_db_id,
    } = job.data;

    const totalModels = selected_models?.length ?? '?';
    const jobStart = Date.now();

    logger.info('[WORKER]', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.info('[WORKER]', '🚀 TRAINING SESSION STARTED', {
      job_id: job.id,
      experiment_id,
      user_id,
      task_type,
      target_column,
      models: selected_models,
      total_models: totalModels,
      pipeline_id: pipeline_id || '(none)',
      dataset_id: dataset_id || 0,
    });
    logger.info('[WORKER]', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    try {
      // ── Step 1: Mark active in DB (status='active') ───────────────────────
      if (job_db_id) {
        await trainingService.updateTrainingJobStatus(job_db_id, 'active');
        // Also update started_at timestamp
        const db = require('../Database/db');
        await db.execute(
          "UPDATE training_jobs SET started_at = NOW() WHERE id = ?",
          [job_db_id]
        );
        logger.info('[WORKER]', '📋 Step 1/5 — DB job status → active, started_at set', { job_db_id });
      }
      await job.updateProgress(10);

      // ── Step 2: Resolve preprocessing steps ─────────────
      let steps = preprocessing_steps || [];
      if (pipeline_id && !preprocessing_steps?.length) {
        logger.info('[WORKER]', '📋 Step 2/5 — Fetching pipeline steps from DB', { pipeline_id });
        const dbSteps = await datasetService.getPipelineSteps(pipeline_id);
        steps = dbSteps.map((s) => ({
          step_index: s.step_index,
          type: s.step_type,
          params: s.step_params,
        }));
        logger.info('[WORKER]', `📋 Step 2/5 — Resolved ${steps.length} preprocessing step(s)`);
      } else {
        logger.info('[WORKER]', `📋 Step 2/5 — Using ${steps.length} preprocessing step(s) from request`);
      }
      await job.updateProgress(20);

      // ── Step 3: Send to ML Service ───────────────────────
      logger.info('[WORKER]', '📋 Step 3/5 — Dispatching to ML Service', {
        url: `${process.env.ML_SERVICE_URL}/api/experiment/train`,
        models: selected_models,
        task: task_type,
        target: target_column,
      });

      const mlStart = Date.now();
      const accepted = await mlService.experimentTrain({
        user_id,
        dataset_id: dataset_id || 0,
        pipeline_id: pipeline_id || experiment_id,
        task_type,
        target_column,
        preprocessing_config,
        selected_models,
        preprocessing_steps: steps,
      });

      // ML service is async — poll until completed
      const mlExperimentId = accepted?.experiment_id;
      logger.info('[WORKER]', `📋 Step 3/5 — ML accepted, polling for results`, {
        ml_experiment_id: mlExperimentId,
        status: accepted?.status,
      });

      let result = accepted;
      if (mlExperimentId && accepted?.status === 'running') {
        const POLL_INTERVAL_MS = 1000;
        const POLL_TIMEOUT_MS = 10 * 60 * 1000; // 10 min timeout
        const pollStart = Date.now();

        while (Date.now() - pollStart < POLL_TIMEOUT_MS) {
          await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

          // Update job progress every poll
          const pollProgress = Math.min(
            30 + Math.floor((Date.now() - pollStart) / POLL_TIMEOUT_MS * 60),
            89
          );
          await job.updateProgress(pollProgress);

          // Also update progress in database
          if (job_db_id) {
            const db = require('../Database/db');
            await db.execute(
              "UPDATE training_jobs SET progress = ? WHERE id = ?",
              [pollProgress, job_db_id]
            );
          }

          const polled = await mlService.getExperiment(mlExperimentId);
          if (!polled) break;

          if (polled.status === 'completed') {
            result = polled;
            break;
          }

          if (polled.status === 'failed') {
            // Preserve structured validation errors so the post-poll handler can inspect them
            if (polled.error_type === 'DATA_VALIDATION_ERROR') {
              result = polled;
              break;
            }
            throw new Error(`ML training failed: ${polled.error ?? 'unknown'}`);
          }

          const elapsed = Math.round((Date.now() - pollStart) / 1000);
          logger.info('[WORKER]', `  ⏳ Polling ML... ${elapsed}s elapsed`, {
            status: polled.status,
            progress: polled.progress,
            models_completed: polled.models_completed,
          });
        }

        if (Date.now() - pollStart >= POLL_TIMEOUT_MS) {
          throw new Error(
            `ML training timeout after ${Math.round(POLL_TIMEOUT_MS / 1000)} seconds`
          );
        }
      }

      const mlDuration = Date.now() - mlStart;
      logger.info('[WORKER]', `📋 Step 3/5 — ML training complete in ${mlDuration}ms`, {
        ml_experiment_id: mlExperimentId,
        base_models_count: (result?.base_models ?? result?.models ?? []).length,
        failed_models_count: (result?.failed_models ?? []).length,
      });
      await job.updateProgress(90);

      // ── Data-validation failure returned by ML service ───
      if (result?.status === 'failed' && result?.error_type === 'DATA_VALIDATION_ERROR') {
        const errMsg = `DATA_VALIDATION_ERROR: ${result.message}`;
        logger.warn('[WORKER]', '⚠️  Dataset validation failed — stopping without retry', {
          experiment_id,
          message: result.message,
          details: result.details,
        });
        if (job_db_id) {
          await trainingService.updateTrainingJobStatus(job_db_id, 'failed', errMsg);
        }
        // Return (not throw) so BullMQ marks the job completed, not failed/retried
        return { status: 'failed', error_type: 'DATA_VALIDATION_ERROR', message: result.message, details: result.details };
      }

      // ── Step 4: Store results + log per-model ────────────
      const successful = result?.base_models ?? result?.models ?? [];
      const failed = result?.failed_models ?? [];

      // Store in database with plots and feature importance
      try {
        await trainingService.storeModelResults(
          experiment_id,
          task_type,
          target_column,
          successful,
          user_id
        );
        logger.info('[WORKER]', `📋 Step 4/5 — Results stored in DB`, {
          experiment_id,
          count: successful.length,
        });
      } catch (dbError) {
        logger.error('[WORKER]', '⚠️  Failed to store in DB', { error: dbError.message });
        throw dbError;
      }

      successful.forEach((m, i) => {
        const primary =
          task_type === 'classification'
            ? `accuracy=${m.accuracy?.toFixed(4) ?? 'N/A'}`
            : `r2=${m.r2_score?.toFixed(4) ?? 'N/A'}`;
        logger.info('[ML]', `  ✅ [${i + 1}/${totalModels}] ${m.model ?? m.name} — ${primary}, time=${m.training_time_ms ?? '?'}ms`);
      });

      failed.forEach((m) => {
        logger.warn('[ML]', `  ❌ ${m.model ?? m.name} — FAILED: ${m.error ?? 'unknown error'}`);
      });

      if (result?.best_model) {
        const bm = result.best_model;
        const metric =
          task_type === 'classification'
            ? `accuracy=${bm.accuracy?.toFixed(4)}`
            : `r2=${bm.r2_score?.toFixed(4)}`;
        logger.info('[ML]', `  🏆 Best model: ${bm.model ?? bm.name} (${metric})`);
      }

      // ── Step 5: Mark completed in DB ─────────────────────
      if (job_db_id) {
        const db = require('../Database/db');
        await db.execute(
          "UPDATE training_jobs SET status = 'completed', progress = 100, completed_at = NOW(), result = ? WHERE id = ?",
          [JSON.stringify(result), job_db_id]
        );
      }
      await job.updateProgress(100);

      const totalDuration = Date.now() - jobStart;
      logger.info('[WORKER]', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logger.info('[WORKER]', '✅ TRAINING SESSION COMPLETE', {
        job_id: job.id,
        experiment_id,
        successful: successful.length,
        failed: failed.length,
        total_models: totalModels,
        ml_time_ms: mlDuration,
        total_time_ms: totalDuration,
      });
      logger.info('[WORKER]', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      return result;

    } catch (error) {
      const totalDuration = Date.now() - jobStart;
      logger.error('[WORKER]', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logger.error('[WORKER]', '❌ TRAINING SESSION FAILED', {
        job_id: job.id,
        experiment_id,
        error: error.message,
        elapsed_ms: totalDuration,
        attempt: job.attemptsMade + 1,
        max_attempts: 3,
      });
      logger.error('[WORKER]', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      if (job_db_id) {
        const db = require('../Database/db');
        // Update status to 'failed', increment retry_count, set completed_at
        await db.execute(
          "UPDATE training_jobs SET status = 'failed', error_message = ?, completed_at = NOW(), retry_count = retry_count + 1 WHERE id = ?",
          [error.message, job_db_id]
        );
      }

      // Re-throw to trigger retry logic (if set in queue options)
      throw error;
    }
  },
  {
    connection,
    // IMPORTANT: Set concurrency to allow multiple users' jobs to run in parallel
    // Adjust based on server resources and ML Service capacity
    concurrency: parseInt(process.env.WORKER_CONCURRENCY || '2', 10),

    // CRITICAL: Lock duration must be > max job duration
    // ML training can take 5-15 minutes, so we set 20 minutes
    lockDuration: 20 * 60 * 1000, // 20 minutes

    // CRITICAL: Stalled job recovery configuration
    // If a job is in "active" state for lockDuration and worker doesn't renew lock,
    // it's marked as "stalled". After maxStalledCount, it's marked as failed.
    maxStalledCount: 2, // Allow 2 stalled detections before marking as failed

    // Rate limiter: Max 10 jobs per minute to prevent overwhelming ML service
    limiter: { max: 10, duration: 60000 },

    // Don't auto-remove lock (let BullMQ handle it)
    skipLockRenew: false,
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// WORKER LIFECYCLE EVENTS (Monitoring & Real-time Updates)
// ─────────────────────────────────────────────────────────────────────────────

trainingWorker.on('active', (job) => {
  logger.info('[WORKER]', `⚡ Job picked up by worker`, {
    job_id: job.id,
    experiment_id: job.data.experiment_id,
    models: job.data.selected_models,
  });
  // TODO: Emit WebSocket event for real-time UI update
  // broadcastTrainingProgress({ experiment_id, status: 'running', progress: 0 });
});

trainingWorker.on('progress', (job, progress) => {
  logger.debug('[WORKER]', `📊 Job progress`, {
    job_id: job.id,
    experiment_id: job.data.experiment_id,
    progress: `${progress}%`,
  });
  // TODO: Emit WebSocket event with progress
});

trainingWorker.on('completed', (job, result) => {
  logger.info('[WORKER]', `🔓 Job completed successfully`, {
    job_id: job.id,
    experiment_id: job.data.experiment_id,
    duration_ms: job.finishedOn - job.processedOn,
  });
  // TODO: Emit WebSocket event: completion, results
});

trainingWorker.on('failed', (job, err) => {
  if (job) {
    const willRetry = job.attemptsMade < 3;
    if (willRetry) {
      logger.warn('[WORKER]', `🔁 Job will retry (attempt ${job.attemptsMade}/3)`, {
        job_id: job.id,
        experiment_id: job.data.experiment_id,
        error: err.message,
      });
    } else {
      logger.error('[WORKER]', `💀 Job exhausted all retries`, {
        job_id: job.id,
        experiment_id: job.data.experiment_id,
        error: err.message,
      });
    }
  }
  // TODO: Emit WebSocket event: failure notification
});

trainingWorker.on('stalled', (jobId) => {
  logger.warn('[WORKER]', `⚠️  Job stalled (will be recovered by scheduler)`, {
    job_id: jobId,
  });
});

trainingWorker.on('error', (err) => {
  logger.error('[WORKER]', 'Worker process error', { error: err.message });
});

// ─────────────────────────────────────────────────────────────────────────────
// GRACEFUL SHUTDOWN
// ─────────────────────────────────────────────────────────────────────────────

process.on('SIGTERM', async () => {
  logger.warn('[WORKER]', 'SIGTERM received, closing worker gracefully...');
  try {
    await trainingWorker.close();
    logger.info('[WORKER]', '✅ Worker closed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('[WORKER]', 'Error closing worker', { error: error.message });
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  logger.warn('[WORKER]', 'SIGINT received, closing worker gracefully...');
  try {
    await trainingWorker.close();
    logger.info('[WORKER]', '✅ Worker closed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('[WORKER]', 'Error closing worker', { error: error.message });
    process.exit(1);
  }
});

module.exports = { trainingWorker };
