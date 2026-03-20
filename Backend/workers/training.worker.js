require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const { Worker } = require('bullmq');
const { connection } = require('../config/redis.config');
const mlService = require('../services/ml.service');
const trainingService = require('../services/training.service');
const datasetService = require('../services/dataset.service');
const pool = require('../Database/db');
const logger = require('../utils/logger');
const { activeTrainingByUser } = require('../utils/trainingLock');

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
      job_id:        job.id,
      experiment_id,
      user_id,
      task_type,
      target_column,
      models:        selected_models,
      total_models:  totalModels,
      pipeline_id:   pipeline_id || '(none)',
      dataset_id:    dataset_id  || 0,
    });
    logger.info('[WORKER]', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    try {
      // ── Step 1: Mark running in DB ───────────────────────
      if (job_db_id) {
        await trainingService.updateTrainingJobStatus(job_db_id, 'running');
        logger.info('[WORKER]', '📋 Step 1/5 — DB job status → running', { job_db_id });
      }
      await job.updateProgress(10);

      // ── Step 2: Resolve preprocessing steps ─────────────
      let steps = preprocessing_steps || [];
      if (pipeline_id && !preprocessing_steps?.length) {
        logger.info('[WORKER]', '📋 Step 2/5 — Fetching pipeline steps from DB', { pipeline_id });
        const dbSteps = await datasetService.getPipelineSteps(pipeline_id);
        steps = dbSteps.map((s) => ({
          step_index: s.step_index,
          type:       s.step_type,
          params:     s.step_params,
        }));
        logger.info('[WORKER]', `📋 Step 2/5 — Resolved ${steps.length} preprocessing step(s)`);
      } else {
        logger.info('[WORKER]', `📋 Step 2/5 — Using ${steps.length} preprocessing step(s) from request`);
      }
      await job.updateProgress(20);

      // ── Step 3: Send to ML Service ───────────────────────
      logger.info('[WORKER]', '📋 Step 3/5 — Dispatching to ML Service', {
        url:     `${process.env.ML_SERVICE_URL}/api/experiment/train`,
        models:  selected_models,
        task:    task_type,
        target:  target_column,
      });

      const mlStart = Date.now();
      const accepted = await mlService.experimentTrain({
        user_id,
        dataset_id:           dataset_id || 0,
        pipeline_id:          pipeline_id || experiment_id,
        task_type,
        target_column,
        preprocessing_config,
        selected_models,
        preprocessing_steps:  steps,
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
        const POLL_TIMEOUT_MS  = 5 * 60 * 1000; // 5 min
        const pollStart = Date.now();

        while (Date.now() - pollStart < POLL_TIMEOUT_MS) {
          await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
          const polled = await mlService.getExperiment(mlExperimentId);
          if (!polled) break;
          if (polled.status === 'completed') {
            result = polled;
            break;
          }
          if (polled.status === 'failed') {
            throw new Error(`ML training failed: ${polled.error ?? 'unknown'}`);
          }
          const elapsed = Math.round((Date.now() - pollStart) / 1000);
          logger.info('[WORKER]', `  ⏳ Polling ML... ${elapsed}s elapsed`, {
            status: polled.status,
            progress: polled.progress,
            models_completed: polled.models_completed,
          });
        }
      }

      const mlDuration = Date.now() - mlStart;
      logger.info('[WORKER]', `📋 Step 3/5 — ML training complete in ${mlDuration}ms`, {
        ml_experiment_id: mlExperimentId,
        base_models_count: (result?.base_models ?? result?.models ?? []).length,
        failed_models_count: (result?.failed_models ?? []).length,
      });
      await job.updateProgress(90);

      // ── Step 4: Store results + log per-model ────────────
      const successful = result?.base_models ?? result?.models ?? [];
      const failed     = result?.failed_models ?? [];

      // Store in database with plots and feature importance
      try {
        await trainingService.storeModelResults(
          experiment_id,
          task_type,
          target_column,
          successful,
          user_id
        );
        logger.info('[WORKER]', `📋 Step 4/5 — Results stored in DB`, { experiment_id, count: successful.length });
      } catch (dbError) {
        logger.error('[WORKER]', '⚠️  Failed to store in DB', { error: dbError.message });
        throw dbError;
      }

      successful.forEach((m, i) => {
        const primary = task_type === 'classification'
          ? `accuracy=${m.accuracy?.toFixed(4) ?? 'N/A'}`
          : `r2=${m.r2_score?.toFixed(4) ?? 'N/A'}`;
        logger.info('[ML]', `  ✅ [${i + 1}/${totalModels}] ${m.model ?? m.name} — ${primary}, time=${m.training_time_ms ?? '?'}ms`);
      });

      failed.forEach((m) => {
        logger.warn('[ML]', `  ❌ ${m.model ?? m.name} — FAILED: ${m.error ?? 'unknown error'}`);
      });

      if (result?.best_model) {
        const bm = result.best_model;
        const metric = task_type === 'classification'
          ? `accuracy=${bm.accuracy?.toFixed(4)}`
          : `r2=${bm.r2_score?.toFixed(4)}`;
        logger.info('[ML]', `  🏆 Best model: ${bm.model ?? bm.name} (${metric})`);
      }

      // ── Step 5: Mark completed in DB ─────────────────────
      if (job_db_id) {
        await trainingService.updateTrainingJobStatus(job_db_id, 'completed');
      }
      await job.updateProgress(100);

      const totalDuration = Date.now() - jobStart;
      logger.info('[WORKER]', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logger.info('[WORKER]', '✅ TRAINING SESSION COMPLETE', {
        job_id:        job.id,
        experiment_id,
        successful:    successful.length,
        failed:        failed.length,
        total_models:  totalModels,
        ml_time_ms:    mlDuration,
        total_time_ms: totalDuration,
      });
      logger.info('[WORKER]', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      return result;

    } catch (error) {
      const totalDuration = Date.now() - jobStart;
      logger.error('[WORKER]', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logger.error('[WORKER]', '❌ TRAINING SESSION FAILED', {
        job_id:        job.id,
        experiment_id,
        error:         error.message,
        elapsed_ms:    totalDuration,
        attempt:       job.attemptsMade + 1,
        max_attempts:  3,
      });
      logger.error('[WORKER]', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      if (job_db_id) {
        await trainingService.updateTrainingJobStatus(job_db_id, 'failed', error.message);
      }
      throw error;
    }
  },
  {
    connection,
    concurrency: parseInt(process.env.WORKER_CONCURRENCY || '2', 10),
    limiter: { max: 10, duration: 60000 },
  }
);

// ── Worker lifecycle events ──────────────────────────────
trainingWorker.on('active', (job) => {
  logger.info('[WORKER]', `⚡ Job picked up by worker`, {
    job_id:       job.id,
    experiment_id: job.data.experiment_id,
    models:       job.data.selected_models,
  });
});

trainingWorker.on('completed', (job, result) => {
  const { user_id, experiment_id } = job.data;
  if (activeTrainingByUser.get(user_id) === experiment_id) {
    activeTrainingByUser.delete(user_id);
  }
  logger.info('[WORKER]', `🔓 Lock released for user ${user_id}`, { experiment_id });
});

trainingWorker.on('failed', (job, err) => {
  if (job) {
    const { user_id, experiment_id } = job.data;
    if (activeTrainingByUser.get(user_id) === experiment_id) {
      activeTrainingByUser.delete(user_id);
    }
    const willRetry = job.attemptsMade < 3;
    if (willRetry) {
      logger.warn('[WORKER]', `🔁 Job will retry (attempt ${job.attemptsMade}/3)`, {
        job_id: job.id, experiment_id, error: err.message,
      });
    } else {
      logger.error('[WORKER]', `💀 Job exhausted all retries`, {
        job_id: job.id, experiment_id, error: err.message,
      });
    }
  }
});

trainingWorker.on('error', (err) => {
  logger.error('[WORKER]', 'Worker process error', { error: err.message });
});

// ── Graceful shutdown ────────────────────────────────────
process.on('SIGTERM', async () => {
  logger.warn('[WORKER]', 'SIGTERM received, closing worker...');
  await trainingWorker.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.warn('[WORKER]', 'SIGINT received, closing worker...');
  await trainingWorker.close();
  process.exit(0);
});

module.exports = { trainingWorker };
