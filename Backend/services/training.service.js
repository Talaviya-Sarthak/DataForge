const pool = require("../Database/db");

// =========================================
// 1. STORE MODEL RESULTS (base + tuned)
// =========================================

/**
 * Insert all trained model results for a pipeline into the `trained_models` table.
 * Stores BOTH base models and tuned models, with proper foreign key mapping.
 * Clears any previous results for this pipeline before inserting.
 *
 * @param {string} pipelineId
 * @param {string} taskType - "classification" or "regression"
 * @param {string} targetColumn
 * @param {Array} baseModels - base models array from MLService response
 * @param {Array} tunedModels - tuned models array from MLService response
 */
const storeModelResults = async (pipelineId, taskType, targetColumn, baseModels, tunedModels = []) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Clear previous results for this pipeline
    await connection.execute(
      "DELETE FROM trained_models WHERE pipeline_id = ?",
      [pipelineId]
    );

    // ── Insert base models ─────────────────────────
    const baseModelIdMap = {}; // model_name → DB id

    for (let i = 0; i < baseModels.length; i++) {
      const m = baseModels[i];
      const [result] = await connection.execute(
        `INSERT INTO trained_models
         (pipeline_id, model, model_path, task_type, target_column,
          accuracy, \`precision\`, recall, f1_score, roc_auc,
          r2_score, mse, rmse, mae,
          best_params, tuning_method, cv_score, is_tuned,
          base_model_id, tuning_iterations, tuning_time_ms, training_time_ms,
          \`rank\`)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          pipelineId,
          m.model,
          m.model_path || "",
          taskType,
          targetColumn,
          m.accuracy ?? null,
          m.precision ?? null,
          m.recall ?? null,
          m.f1_score ?? null,
          m.roc_auc ?? null,
          m.r2_score ?? null,
          m.mse ?? null,
          m.rmse ?? null,
          m.mae ?? null,
          null,  // best_params (base model has none)
          null,  // tuning_method
          null,  // cv_score
          false, // is_tuned
          null,  // base_model_id
          null,  // tuning_iterations
          null,  // tuning_time_ms
          m.training_time_ms ?? null,
          i,     // rank = index in sorted array
        ]
      );
      baseModelIdMap[m.model] = result.insertId;
    }

    // ── Insert tuned models ────────────────────────
    for (let i = 0; i < tunedModels.length; i++) {
      const m = tunedModels[i];
      const baseId = baseModelIdMap[m.model] || null;
      const bestParams = m.best_params ? JSON.stringify(m.best_params) : null;

      await connection.execute(
        `INSERT INTO trained_models
         (pipeline_id, model, model_path, task_type, target_column,
          accuracy, \`precision\`, recall, f1_score, roc_auc,
          r2_score, mse, rmse, mae,
          best_params, tuning_method, cv_score, is_tuned,
          base_model_id, tuning_iterations, tuning_time_ms, training_time_ms,
          \`rank\`)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          pipelineId,
          m.model + " (Tuned)",
          m.model_path || "",
          taskType,
          targetColumn,
          m.accuracy ?? null,
          m.precision ?? null,
          m.recall ?? null,
          m.f1_score ?? null,
          m.roc_auc ?? null,
          m.r2_score ?? null,
          m.mse ?? null,
          m.rmse ?? null,
          m.mae ?? null,
          bestParams,
          "RandomizedSearchCV",
          m.tuned_score ?? m.cv_score ?? null,
          true,
          baseId,
          m.tuning_iterations ?? null,
          m.tuning_time_ms ?? null,
          m.training_time_ms ?? null,
          baseModels.length + i, // rank continues after base models
        ]
      );
    }

    await connection.commit();
    return baseModels.length + tunedModels.length;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// =========================================
// 2. GET MODEL RESULTS
// =========================================

/**
 * Retrieve all trained models for a pipeline, ordered by rank.
 */
const getModelsByPipeline = async (pipelineId) => {
  const [rows] = await pool.execute(
    "SELECT * FROM trained_models WHERE pipeline_id = ? ORDER BY `rank` ASC",
    [pipelineId]
  );
  return rows;
};

// =========================================
// 3. CREATE TRAINING JOB
// =========================================

/**
 * Create a training_jobs record to track training history.
 */
const createTrainingJob = async (pipelineId, userId, datasetId, taskType, targetColumn) => {
  const [result] = await pool.execute(
    `INSERT INTO training_jobs
     (pipeline_id, user_id, dataset_id, task_type, target_column, status)
     VALUES (?, ?, ?, ?, ?, 'running')`,
    [pipelineId, userId, datasetId ?? null, taskType, targetColumn]
  );
  return result.insertId;
};

// =========================================
// 4. UPDATE TRAINING JOB STATUS
// =========================================

const updateTrainingJobStatus = async (jobId, status, errorMessage = null) => {
  await pool.execute(
    "UPDATE training_jobs SET status = ?, error_message = ? WHERE id = ?",
    [status, errorMessage, jobId]
  );
};

module.exports = {
  storeModelResults,
  getModelsByPipeline,
  createTrainingJob,
  updateTrainingJobStatus,
};
