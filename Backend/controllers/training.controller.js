const mlService = require("../services/ml.service");
const trainingService = require("../services/training.service");
const datasetService = require("../services/dataset.service");

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

  // ── 3. Create training job ────────────────
  let jobId;
  try {
    jobId = await trainingService.createTrainingJob(
      String(pipeline_id),
      userId,
      pipeline.ds_id,
      task_type,
      target_column
    );
  } catch (err) {
    console.error("❌ Failed to create training job:", err.message);
    return res.status(500).json({ status: "error", message: "Failed to create training job" });
  }

  try {
    // ── 4. Get pipeline steps ─────────────────
    const allSteps = await datasetService.getPipelineSteps(pipeline_id);

    // ── 5. Finalize pipeline in MLService ─────
    await mlService.finalizePipeline({
      pipeline_id: String(pipeline_id),
      user_id: userId,
      dataset_id: pipeline.ds_id,
      steps: allSteps.map((s) => ({
        step_index: s.step_index,
        type: s.step_type,
        params: s.step_params,
      })),
    });

    // ── 6. Call MLService /api/train ───────────
    const mlResult = await mlService.trainPipeline({
      pipeline_id: String(pipeline_id),
      task_type,
      target_column,
    });

    // ── 7. Store results in database ──────────
    const models = mlResult.models || [];
    await trainingService.storeModelResults(
      String(pipeline_id),
      task_type,
      target_column,
      models
    );

    // ── 8. Update training job status ─────────
    await trainingService.updateTrainingJobStatus(jobId, "completed");

    // ── 9. Format response for frontend ───────
    const bestModel = models[0] || null;

    return res.status(200).json({
      status: "success",
      pipeline_id: mlResult.pipeline_id,
      task_type: mlResult.task_type,
      target_column: mlResult.target_column,
      best_model: bestModel,
      leaderboard: models.map((m, index) => ({ ...m, rank: index })),
      feature_engineering: mlResult.feature_engineering || {},
    });
  } catch (error) {
    console.error("❌ Training Error:", error.message);

    // Update job status to failed
    if (jobId) {
      await trainingService.updateTrainingJobStatus(jobId, "failed", error.message).catch(() => {});
    }

    // Handle specific MLService errors
    if (error.message.includes("not reachable")) {
      return res.status(503).json({
        status: "error",
        message: "ML Service is unavailable. Please try again later.",
      });
    }

    if (error.message.includes("No dataset uploaded") || error.message.includes("No finalized dataset")) {
      return res.status(400).json({
        status: "error",
        message: "Dataset not found in ML Service. Please re-upload and finalize your dataset.",
      });
    }

    return res.status(500).json({
      status: "error",
      message: "Training failed",
      detail: error.message,
    });
  }
};

// =========================================
// GET /api/training/:pipelineId/results
// =========================================
exports.getTrainingResults = async (req, res) => {
  try {
    const { pipelineId } = req.params;

    const models = await trainingService.getModelsByPipeline(String(pipelineId));
    if (!models.length) {
      return res.status(404).json({ status: "error", message: "No training results found" });
    }

    const bestModel = models[0];

    return res.status(200).json({
      status: "success",
      pipeline_id: pipelineId,
      task_type: bestModel.task_type,
      target_column: bestModel.target_column,
      best_model: formatModelForResponse(bestModel),
      leaderboard: models.map((m) => formatModelForResponse(m)),
    });
  } catch (error) {
    console.error("❌ Get Results Error:", error.message);
    return res.status(500).json({ status: "error", message: "Failed to fetch training results" });
  }
};

/**
 * Format a DB row into the response shape, stripping nulls for the irrelevant metric type.
 */
function formatModelForResponse(row) {
  const base = {
    model: row.model,
    model_path: row.model_path,
    rank: row.rank,
  };

  if (row.task_type === "classification") {
    return {
      ...base,
      accuracy: row.accuracy,
      precision: row.precision,
      recall: row.recall,
      f1_score: row.f1_score,
      roc_auc: row.roc_auc,
    };
  }

  return {
    ...base,
    r2_score: row.r2_score,
    mse: row.mse,
    rmse: row.rmse,
    mae: row.mae,
  };
}
