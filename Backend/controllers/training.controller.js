const mlService = require("../services/ml.service");
const trainingService = require("../services/training.service");
const datasetService = require("../services/dataset.service");
const { trainingQueue } = require("../queues/training.queue");
const jobService = require("../services/job.service");
const logger = require("../utils/logger");
// =========================================
// POST /api/training/train
// =========================================
exports.trainModel = async (req, res) => {
  const { pipeline_id, task_type, target_column } = req.body;
  const userId = req.user.id;

  // ── 1. Validate input ─────────────────────
  if (!pipeline_id) {
    return res.status(400).json({ status: "error", message: "pipeline_id is required" });
  }
  if (!task_type || !["classification", "regression"].includes(task_type)) {
    return res.status(400).json({
      status: "error",
      message: "task_type must be 'classification' or 'regression'",
    });
  }
  if (!target_column) {
    return res.status(400).json({ status: "error", message: "target_column is required" });
  }

  // ── 2. Verify pipeline exists in DB ───────
  let pipeline;
  try {
    const [rows] = await require("../Database/db").execute(
      "SELECT p.*, d.id AS ds_id FROM pipelines p JOIN datasets d ON d.id = p.dataset_id WHERE p.id = ? AND p.user_id = ?",
      [pipeline_id, userId]
    );
    pipeline = rows[0];
  } catch (err) {
    return res.status(500).json({ status: "error", message: "Database error verifying pipeline" });
  }

  if (!pipeline) {
    return res.status(404).json({ status: "error", message: "Pipeline not found" });
  }

  // ── 3. Delegate to queue-based path ──────
  req.body.pipeline_id = String(pipeline_id);
  req.body.dataset_id = pipeline.ds_id;
  req.body.selected_models = req.body.selected_models || [];
  return exports.experimentTrain(req, res);};

// =========================================
// GET /api/training/:pipelineId/results
// =========================================
exports.getTrainingResults = async (req, res) => {
  try {
    const { pipelineId } = req.params;
    const result = await trainingService.getExperimentResults(String(pipelineId), req.user.id);
    if (!result) {
      return res.status(404).json({ status: 'error', message: 'No training results found' });
    }
    return res.status(200).json(result);
  } catch (error) {
    logger.error('[TRAIN]', 'Get results error', { error: error.message });
    return res.status(500).json({ status: 'error', message: 'Failed to fetch training results' });
  }
};


// GET /api/training/models/available
// =========================================
exports.getAvailableModels = async (req, res) => {
  try {
    const { task_type } = req.query;

    if (!task_type || !["classification", "regression"].includes(task_type)) {
      return res.status(400).json({
        status: "error",
        message: "task_type query parameter must be 'classification' or 'regression'",
      });
    }

    const result = await mlService.getAvailableModels(task_type);
    return res.status(200).json({
      status: "success",
      ...result,
    });
  } catch (error) {
    logger.error('[TRAIN]', 'Get available models error', { error: error.message });
    return res.status(500).json({
      status: "error",
      message: "Failed to fetch available models",
      detail: error.message,
    });
  }
};

// =========================================
// POST /api/training/experiment/train
// =========================================
exports.experimentTrain = async (req, res) => {
  const userId = req.user.id;
  const {
    pipeline_id,
    dataset_id,
    task_type,
    target_column,
    preprocessing_config,
    selected_models,
    preprocessing_steps,
  } = req.body;

  // Validate required fields
  if (!task_type || !["classification", "regression"].includes(task_type)) {
    return res.status(400).json({
      status: "error",
      message: "task_type must be 'classification' or 'regression'",
    });
  }
  if (!target_column) {
    return res.status(400).json({
      status: "error",
      message: "target_column is required",
    });
  }
  if (!selected_models || selected_models.length === 0) {
    return res.status(400).json({
      status: "error",
      message: "selected_models is required and must not be empty",
    });
  }

  try {
    // ═══════════════════════════════════════════════════════════════════════════
    // REMOVED: Per-user global lock (activeTrainingByUser)
    // ═══════════════════════════════════════════════════════════════════════════
    // REASON: This was causing the "training in progress" error that blocked users.
    // BullMQ handles job queueing and concurrency automatically.
    // Users can now submit multiple training jobs - they'll be processed
    // sequentially based on worker concurrency settings.
    // ═══════════════════════════════════════════════════════════════════════════

    // Get dataset_id from pipeline if not provided
    let dsId = dataset_id;
    let pipeId = pipeline_id;

    if (pipeline_id && !dataset_id) {
      const [rows] = await require("../Database/db").execute(
        "SELECT dataset_id FROM pipelines WHERE id = ? AND user_id = ?",
        [pipeline_id, userId]
      );
      if (rows[0]) {
        dsId = rows[0].dataset_id;
      }
    }

    // Generate experiment ID
    const experiment_id = `exp_${userId}_${Date.now()}`;

    logger.info('[API]', '📥 Train request received', {
      experiment_id,
      user_id: userId,
      task_type,
      target_column,
      models: selected_models,
      total_models: selected_models.length,
      pipeline_id: pipeId || '(none)',
      dataset_id: dsId || 0,
    });

    // Create training job in database
    const jobDbId = await trainingService.createTrainingJob(
      pipeId || experiment_id,
      userId,
      dsId,
      task_type,
      target_column
    );
    logger.info('[API]', '📋 DB training job created', { job_db_id: jobDbId, experiment_id });

    // Add job to Redis queue
    const job = await trainingQueue.add(
      'train-models',
      {
        experiment_id,
        user_id: userId,
        dataset_id: dsId,
        pipeline_id: pipeId,
        task_type,
        target_column,
        preprocessing_config,
        selected_models,
        preprocessing_steps,
        job_db_id: jobDbId,
      },
      {
        jobId: experiment_id, // Use experiment_id as job ID for easy lookup
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      }
    );

    logger.info('[QUEUE]', '📬 Job added to Redis queue', {
      job_id: job.id,
      experiment_id,
      queue: 'training-queue',
      models: selected_models,
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // NOTE: Per-user lock REMOVED - was causing the "training in progress" issue
    // Multiple users can now train simultaneously without blocking
    // BullMQ handles job queueing and concurrency automatically
    // ═══════════════════════════════════════════════════════════════════════════

    // Return immediately with queued status
    return res.status(202).json({
      status: "success",
      message: "Training job queued successfully",
      experiment_id,
      job_id: job.id,
      queue_status: "queued",
    });
  } catch (error) {
    logger.error('[TRAIN]', 'Experiment train error', { error: error.message });

    if (error.message.includes("not reachable")) {
      return res.status(503).json({
        status: "error",
        message: "Queue service is unavailable. Please try again later.",
      });
    }

    return res.status(500).json({
      status: "error",
      message: "Failed to queue training job",
      detail: error.message,
    });
  }
};



// =========================================
// GET /api/training/experiment/:experimentId
// =========================================
exports.getExperiment = async (req, res) => {
  try {
    const { experimentId } = req.params;

    // 1. Check queue state first (fast, O(1) Redis lookup)
    const queueStatus = await jobService.getExperimentStatus(experimentId);

    // 1a. Still in-flight — tell the frontend to keep polling
    if (queueStatus && (queueStatus.status === 'queued' || queueStatus.status === 'running')) {
      return res.status(200).json({
        status: queueStatus.status,
        experiment_id: experimentId,
        progress: queueStatus.progress,
        job_id: queueStatus.job_id,
        retry_after: 5000,
        message: queueStatus.status === 'queued'
          ? 'Training job is queued and waiting to be processed'
          : 'Training is in progress',
      });
    }

    // 1b. Queue reports failed with no DB result yet
    if (queueStatus && queueStatus.status === 'failed') {
      // Still try DB first — worker may have stored partial results
      const dbResult = await trainingService.getExperimentResults(experimentId, req.user.id);
      if (dbResult) return res.status(200).json(dbResult);

      return res.status(200).json({
        status: 'failed',
        experiment_id: experimentId,
        error: queueStatus.error || 'Training failed',
        job_id: queueStatus.job_id,
      });
    }

    // 2. Job is completed (or not in queue at all) — DB is the authoritative source
    const dbResult = await trainingService.getExperimentResults(experimentId, req.user.id);
    if (dbResult) return res.status(200).json(dbResult);

    // 3. DB has no rows yet — check training_jobs for status clues
    const jobRecord = await trainingService.getTrainingJobByExperiment(experimentId, req.user.id);
    if (jobRecord) {
      if (jobRecord.status === 'failed') {
        return res.status(200).json({
          status: 'failed',
          experiment_id: experimentId,
          error: jobRecord.error_message || 'Training failed',
        });
      }
      // running or completed but trained_models not written yet — ask frontend to retry
      if (jobRecord.status === 'running' || jobRecord.status === 'completed') {
        return res.status(200).json({
          status: 'running',
          experiment_id: experimentId,
          progress: 90,
          message: 'Finalising results, please wait…',
        });
      }
    }

    // 4. Nothing found anywhere
    return res.status(404).json({
      status: 'error',
      message: `Experiment '${experimentId}' not found`,
    });

  } catch (error) {
    logger.error('[TRAIN]', 'Get experiment error', { error: error.message, stack: error.stack });
    if (error.message?.includes('not reachable') || error.code === 'ECONNREFUSED') {
      return res.status(503).json({ status: 'error', message: 'ML Service is unavailable.' });
    }
    return res.status(500).json({ status: 'error', message: 'Failed to fetch experiment', detail: error.message });
  }
};

// =========================================
// GET /api/training/experiment/:experimentId/plots/:modelName
// =========================================
exports.getExperimentPlots = async (req, res) => {
  try {
    const { experimentId, modelName } = req.params;

    const result = await mlService.getExperimentPlots(experimentId, modelName);
    if (!result) {
      return res.status(404).json({
        status: "error",
        message: `Plot data not found for model '${modelName}' in experiment '${experimentId}'`,
      });
    }

    return res.status(200).json({
      status: "success",
      ...result,
    });
  } catch (error) {
    logger.error('[TRAIN]', 'Get experiment plots error', { error: error.message });
    return res.status(500).json({
      status: "error",
      message: "Failed to fetch plot data",
      detail: error.message,
    });
  }
};

// =========================================
// GET /api/training/experiments
// =========================================
exports.listExperiments = async (req, res) => {
  try {
    const { pipeline_id } = req.query;

    const result = await mlService.listExperiments(pipeline_id);

    return res.status(200).json({
      status: "success",
      ...result,
    });
  } catch (error) {
    logger.error('[TRAIN]', 'List experiments error', { error: error.message });
    return res.status(500).json({
      status: "error",
      message: "Failed to list experiments",
      detail: error.message,
    });
  }
};

// =========================================
// GET /api/training/job/:jobId
// =========================================
exports.getJobStatus = async (req, res) => {
  try {
    const { jobId } = req.params;

    const jobStatus = await jobService.getJobStatus(jobId);

    if (!jobStatus) {
      return res.status(404).json({
        status: "error",
        message: `Job '${jobId}' not found`,
      });
    }

    return res.status(200).json({
      status: "success",
      ...jobStatus,
    });
  } catch (error) {
    logger.error('[TRAIN]', 'Get job status error', { error: error.message });
    return res.status(500).json({
      status: "error",
      message: "Failed to fetch job status",
      detail: error.message,
    });
  }
};

// =========================================
// DELETE /api/training/job/:jobId
// =========================================
exports.cancelJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    const result = await jobService.cancelJob(jobId);

    return res.status(200).json({
      status: "success",
      ...result,
    });
  } catch (error) {
    logger.error('[TRAIN]', 'Cancel job error', { error: error.message });
    return res.status(500).json({
      status: "error",
      message: "Failed to cancel job",
      detail: error.message,
    });
  }
};

// =========================================
// GET /api/training/queue/metrics
// =========================================
exports.getQueueMetrics = async (req, res) => {
  try {
    const metrics = await jobService.getQueueMetrics();

    return res.status(200).json({
      status: "success",
      metrics,
    });
  } catch (error) {
    logger.error('[TRAIN]', 'Get queue metrics error', { error: error.message });
    return res.status(500).json({
      status: "error",
      message: "Failed to fetch queue metrics",
      detail: error.message,
    });
  }
};

// =========================================
// GET /api/training/queue/status (BONUS)
// =========================================
exports.getQueueStatus = async (req, res) => {
  try {
    const metrics = await jobService.getQueueMetrics();

    // Get recent jobs
    const { trainingQueue } = require('../queues/training.queue');
    const [waitingJobs, activeJobs, completedJobs, failedJobs] = await Promise.all([
      trainingQueue.getJobs(['waiting'], 0, 5),
      trainingQueue.getJobs(['active'], 0, 5),
      trainingQueue.getJobs(['completed'], 0, 5),
      trainingQueue.getJobs(['failed'], 0, 5),
    ]);

    return res.status(200).json({
      status: "success",
      queue_name: "training-queue",
      metrics: {
        waiting: metrics.waiting,
        active: metrics.active,
        completed: metrics.completed,
        failed: metrics.failed,
        delayed: metrics.delayed,
        total: metrics.total,
      },
      recent_jobs: {
        waiting: waitingJobs.map(j => ({ id: j.id, experiment_id: j.data.experiment_id })),
        active: activeJobs.map(j => ({ id: j.id, experiment_id: j.data.experiment_id, progress: j.progress })),
        completed: completedJobs.map(j => ({ id: j.id, experiment_id: j.data.experiment_id })),
        failed: failedJobs.map(j => ({ id: j.id, experiment_id: j.data.experiment_id, reason: j.failedReason })),
      },
    });
  } catch (error) {
    logger.error('[TRAIN]', 'Get queue status error', { error: error.message });
    return res.status(500).json({
      status: "error",
      message: "Failed to fetch queue status",
      detail: error.message,
    });
  }
};

// =========================================
// GET /api/training/results/:experimentId
// =========================================
exports.getResults = async (req, res) => {
  try {
    const { experimentId } = req.params;
    const result = await trainingService.getExperimentResults(experimentId, req.user.id);

    if (!result) {
      return res.status(404).json({
        status: 'error',
        message: 'No training results found for this experiment',
      });
    }

    return res.status(200).json(result);
  } catch (error) {
    logger.error('[TRAIN]', 'Get results error', { error: error.message });
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch training results',
      detail: error.message,
    });
  }
};

// =========================================
// GET /api/training/models/:modelId/details
// =========================================
exports.getModelDetails = async (req, res) => {
  try {
    const { modelId } = req.params;
    const model = await trainingService.getModelById(modelId, req.user.id);

    if (!model) {
      return res.status(404).json({
        status: 'error',
        message: 'Model not found',
      });
    }

    return res.status(200).json({
      status: 'success',
      model,
    });
  } catch (error) {
    logger.error('[TRAIN]', 'Get model details error', { error: error.message });
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch model details',
      detail: error.message,
    });
  }
};

// =========================================
// GET /api/training/models
// =========================================
exports.listModels = async (req, res) => {
  try {
    const { page = 1, limit = 10, model_type: modelType } = req.query;

    if (modelType && !['classification', 'regression'].includes(modelType)) {
      return res.status(400).json({
        status: 'error',
        message: "model_type must be 'classification' or 'regression'",
      });
    }

    const result = await trainingService.listModels(req.user.id, {
      page,
      limit,
      modelType: modelType || null,
    });

    return res.status(200).json({
      status: 'success',
      ...result,
    });
  } catch (error) {
    logger.error('[TRAIN]', 'List models error', { error: error.message });
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch trained models',
      detail: error.message,
    });
  }
};

// =========================================
// GET /api/training/models/:modelId/download
// Downloads model and deletes all data
// =========================================
exports.downloadModel = async (req, res) => {
  try {
    const { modelId } = req.params;
    const model = await trainingService.getModelById(modelId, req.user.id);

    if (!model) {
      return res.status(404).json({
        status: 'error',
        message: 'Model not found',
      });
    }

    const modelPath = model.absolute_model_path;
    if (!modelPath) {
      return res.status(404).json({
        status: 'error',
        message: 'Model file path not found',
      });
    }

    // Check if file exists
    try {
      const fs = require('fs').promises;
      await fs.access(modelPath);
    } catch {
      return res.status(404).json({
        status: 'error',
        message: 'Model file not found on disk',
      });
    }

    const path = require('path');
    const fileName = path.basename(modelPath);

    // Send file for download
    res.download(modelPath, fileName, async (err) => {
      if (err) {
        logger.error('[TRAIN]', 'Model download error', { error: err.message });
        if (!res.headersSent) {
          res.status(500).json({
            status: 'error',
            message: 'Failed to download model file',
          });
        }
        return;
      }

      try {
        logger.info('[TRAIN]', 'Download successful, deleting model data', { modelId });

        await trainingService.deleteModelAndArtifacts(modelId, req.user.id);
        logger.info('[TRAIN]', 'Model lifecycle completed', { modelId, fileName });
      } catch (deleteError) {
        logger.error('[TRAIN]', 'Failed to cleanup after download', { error: deleteError.message });
      }
    });
  } catch (error) {
    logger.error('[TRAIN]', 'Download model error', { error: error.message });
    return res.status(500).json({
      status: 'error',
      message: 'Failed to download model',
      detail: error.message,
    });
  }
};

// =========================================
// DELETE /api/training/models/:modelId
// =========================================
exports.deleteModel = async (req, res) => {
  try {
    const { modelId } = req.params;
    const deleted = await trainingService.deleteModelAndArtifacts(modelId, req.user.id);

    return res.status(200).json({
      status: 'success',
      message: 'Model deleted successfully',
      model: deleted,
    });
  } catch (error) {
    const statusCode = error.message === 'Model not found' ? 404 : 500;
    logger.error('[TRAIN]', 'Delete model error', { error: error.message });
    return res.status(statusCode).json({
      status: 'error',
      message: error.message === 'Model not found' ? 'Model not found' : 'Failed to delete model',
      detail: error.message,
    });
  }
};

// =========================================
// POST /api/training/models/compare
// Compare multiple models
// =========================================
exports.compareModels = async (req, res) => {
  try {
    const { model_ids } = req.body;

    if (!model_ids || !Array.isArray(model_ids) || model_ids.length < 2) {
      return res.status(400).json({
        status: 'error',
        message: 'At least 2 model IDs required for comparison',
      });
    }

    const models = await trainingService.getModelsByIds(model_ids, req.user.id);

    if (models.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'No models found',
      });
    }

    // Verify all models are same type
    const types = [...new Set(models.map(m => m.model_type))];
    if (types.length > 1) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot compare models of different types (regression vs classification)',
        found_types: types,
      });
    }

    const modelType = types[0];

    // Build comparison data
    const comparison = {
      model_type: modelType,
      models: models.map(m => ({
        model_id: m.model_id,
        model_name: m.model_name,
        metrics: m.metrics,
      })),
      charts: buildComparisonCharts(models, modelType),
    };

    return res.status(200).json({
      status: 'success',
      comparison,
    });
  } catch (error) {
    logger.error('[TRAIN]', 'Compare models error', { error: error.message });
    return res.status(500).json({
      status: 'error',
      message: 'Failed to compare models',
      detail: error.message,
    });
  }
};

/**
 * Build comparison charts based on model type
 */
