const pool = require("../Database/db");

// =========================================
// 1. STORE MODEL RESULTS
// =========================================

/**
 * Insert all trained model results for a pipeline into the `trained_models` table.
 * Clears any previous results for this pipeline before inserting.
 *
 * @param {string} pipelineId
 * @param {string} taskType - "classification" or "regression"
 * @param {string} targetColumn
 * @param {Array} models - models array from MLService response
 */
const storeModelResults = async (pipelineId, taskType, targetColumn, models) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Clear previous results for this pipeline
    await connection.execute(
      "DELETE FROM trained_models WHERE pipeline_id = ?",
      [pipelineId]
    );

    // Insert each model with its rank
    for (let i = 0; i < models.length; i++) {
      const m = models[i];
      await connection.execute(
        `INSERT INTO trained_models
         (pipeline_id, model, model_path, task_type, target_column,
          accuracy, \`precision\`, recall, f1_score, roc_auc,
          r2_score, mse, rmse, mae, \`rank\`)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          pipelineId,
          m.model,
          m.model_path,
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
          i, // rank = index in sorted array
        ]
      );
    }

    await connection.commit();
    return models.length;
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
