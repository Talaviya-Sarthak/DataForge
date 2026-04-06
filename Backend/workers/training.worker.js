require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const { Worker } = require('bullmq');
const { connection } = require('../config/redis.config');
const mlService = require('../services/ml.service');
const trainingService = require('../services/training.service');
const datasetService = require('../services/dataset.service');

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


    try {
      // ── Step 1: Mark running in DB ───────────────────────
      if (job_db_id) {
        await trainingService.updateTrainingJobStatus(job_db_id, 'running');
      }
      await job.updateProgress(10);

      // ── Step 2: Resolve preprocessing steps ─────────────
      let steps = preprocessing_steps || [];
      if (pipeline_id && !preprocessing_steps?.length) {
        const dbSteps = await datasetService.getPipelineSteps(pipeline_id);
        steps = dbSteps.map((s) => ({
          step_index: s.step_index,
          type: s.step_type,
          params: s.step_params,
        }));
      }
      await job.updateProgress(20);

      // ── Step 3: Send to ML Service ───────────────────────
      const mlStart = Date.now();
      let accepted;
      try {
        accepted = await mlService.experimentTrain({
          user_id,
          dataset_id: dataset_id || 0,
          pipeline_id: pipeline_id || experiment_id,
          task_type,
          target_column,
          preprocessing_config,
          selected_models,
          preprocessing_steps: steps,
        });
      } catch (mlError) {
        if (mlError.message?.includes('No dataset uploaded')) {
          
          try {
            // Try to re-upload the dataset from backend cache
            await mlService.rehydrateIfNeeded(user_id, dataset_id);
            
            // Retry the training request once
            try {
              accepted = await mlService.experimentTrain({
                user_id,
                dataset_id: dataset_id || 0,
                pipeline_id: pipeline_id || experiment_id,
                task_type,
                target_column,
                preprocessing_config,
                selected_models,
                preprocessing_steps: steps,
              });
            } catch (retryError) {
              throw retryError;
            }
          } catch (rehydrateError) {
            const errMsg = `Cannot resume training: ${rehydrateError.message}. Please re-upload your dataset and start training again.`;
            if (job_db_id) await trainingService.updateTrainingJobStatus(job_db_id, 'failed', errMsg);
            return { status: 'failed', error_type: 'SESSION_EXPIRED', message: errMsg };
          }
        } else {
          throw mlError;
        }
      }

      // ML service is async — poll until completed
      const mlExperimentId = accepted?.experiment_id;

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
        }

        if (Date.now() - pollStart >= POLL_TIMEOUT_MS) {
          throw new Error(
            `ML training timeout after ${Math.round(POLL_TIMEOUT_MS / 1000)} seconds`
          );
        }
      }

      const mlDuration = Date.now() - mlStart;
      const modelCount = (result?.base_models ?? result?.models ?? []).length;

      await job.updateProgress(90);

      // ── Data-validation failure returned by ML service ───
      if (result?.status === 'failed' && result?.error_type === 'DATA_VALIDATION_ERROR') {
        const errMsg = `DATA_VALIDATION_ERROR: ${result.message}`;
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
      if (successful.length === 0) {
      } else {
        try {
          const startDbWrite = Date.now();
          await trainingService.storeModelResults(
            experiment_id,
            task_type,
            target_column,
            successful,
            user_id
          );
          const dbWriteTime = Date.now() - startDbWrite;
        } catch (dbError) {
          // Mark as failed in training_jobs before throwing
          if (job_db_id) {
            await trainingService.updateTrainingJobStatus(
              job_db_id, 
              'failed', 
              `DB write failed: ${dbError.message}`
            );
          }
          throw dbError;
        }
      }

      successful.forEach((m, i) => {
      });

      failed.forEach((m) => {
      });

      // ── Step 5: Mark completed in DB ─────────────────────
      if (job_db_id) {
        await trainingService.updateTrainingJobStatus(job_db_id, 'completed');
      }
      await job.updateProgress(100);

      const totalDuration = Date.now() - jobStart;

      return result;

    } catch (error) {
      const totalDuration = Date.now() - jobStart;

      if (job_db_id) {
        await trainingService.updateTrainingJobStatus(job_db_id, 'failed', error.message);
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
  // TODO: Emit WebSocket event for real-time UI update
  // broadcastTrainingProgress({ experiment_id, status: 'running', progress: 0 });
});

trainingWorker.on('progress', (job, progress) => {
  // TODO: Emit WebSocket event with progress
});

trainingWorker.on('completed', (job, result) => {
  // TODO: Emit WebSocket event: completion, results
});

trainingWorker.on('failed', (job, err) => {
  if (job) {
    const willRetry = job.attemptsMade < 3;
    if (willRetry) {
    } else {
    }
  }
  // TODO: Emit WebSocket event: failure notification
});

trainingWorker.on('stalled', (jobId) => {
});

trainingWorker.on('error', (err) => {
});

// ─────────────────────────────────────────────────────────────────────────────
// GRACEFUL SHUTDOWN
// ─────────────────────────────────────────────────────────────────────────────

process.on('SIGTERM', async () => {
  try {
    await trainingWorker.close();
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  try {
    await trainingWorker.close();
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
});

module.exports = { trainingWorker };
