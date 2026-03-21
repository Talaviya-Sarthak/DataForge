const pool = require("../Database/db");
const logger = require("../utils/logger");

/**
 * Store model results - ONLY uses trained_models and model_plots
 */
const storeModelResults = async (experimentId, taskType, targetColumn, baseModels, userId) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Delete existing results for this experiment
    await connection.execute(
      "DELETE FROM trained_models WHERE experiment_id = ?",
      [experimentId]
    );

    for (const m of baseModels) {
      // Insert into trained_models
      const [result] = await connection.execute(
        `INSERT INTO trained_models
         (experiment_id, user_id, target_column, model_name, model_type, model_path,
          accuracy, \`precision\`, recall, f1_score, roc_auc,
          r2_score, mse, rmse, mae, training_time_ms)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          experimentId,
          userId,
          targetColumn,
          m.model || m.name,
          taskType,
          m.model_path || "",
          m.accuracy ?? null,
          m.precision ?? null,
          m.recall ?? null,
          m.f1_score ?? null,
          m.roc_auc ?? null,
          m.r2_score ?? null,
          m.mse ?? null,
          m.rmse ?? null,
          m.mae ?? null,
          m.training_time_ms ?? null,
        ]
      );

      const modelId = result.insertId;
      const plots = m.plots || {};
      const featureImportance = m.feature_importance || null;

      // Insert into model_plots
      await connection.execute(
        `INSERT INTO model_plots
         (model_id, confusion_matrix, roc_curve, precision_recall_curve, class_labels,
          residuals, predicted_vs_actual, error_distribution, residual_vs_predicted, 
          regression_line, feature_importance)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          modelId,
          plots.confusion_matrix ? JSON.stringify(plots.confusion_matrix) : null,
          plots.roc_curve ? JSON.stringify(plots.roc_curve) : null,
          plots.precision_recall_curve ? JSON.stringify(plots.precision_recall_curve) : null,
          plots.class_labels ? JSON.stringify(plots.class_labels) : null,
          plots.residuals ? JSON.stringify(plots.residuals) : null,
          plots.predicted_vs_actual ? JSON.stringify(plots.predicted_vs_actual) : null,
          plots.error_distribution ? JSON.stringify(plots.error_distribution) : null,
          plots.residual_vs_predicted ? JSON.stringify(plots.residual_vs_predicted) : null,
          plots.regression_line ? JSON.stringify(plots.regression_line) : null,
          featureImportance ? JSON.stringify(featureImportance) : null,
        ]
      );
    }

    await connection.commit();
    logger.info('[DB]', `Stored ${baseModels.length} models for experiment ${experimentId}`);
    return baseModels.length;
  } catch (error) {
    await connection.rollback();
    logger.error('[DB]', 'Failed to store model results', { error: error.message });
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Get models by experiment
 */
const getModelsByExperiment = async (experimentId, userId = null) => {
  let query = `SELECT 
      tm.*,
      mp.confusion_matrix,
      mp.roc_curve,
      mp.precision_recall_curve,
      mp.class_labels,
      mp.residuals,
      mp.predicted_vs_actual,
      mp.error_distribution,
      mp.residual_vs_predicted,
      mp.regression_line,
      mp.feature_importance
     FROM trained_models tm
     LEFT JOIN model_plots mp ON tm.id = mp.model_id
     WHERE tm.experiment_id = ?`;
  const params = [experimentId];
  
  if (userId) {
    query += ` AND tm.user_id = ?`;
    params.push(userId);
  }
  
  query += ` ORDER BY 
       CASE WHEN tm.model_type = 'classification' THEN tm.accuracy ELSE tm.r2_score END DESC`;
  
  const [rows] = await pool.execute(query, params);
  return rows;
};

/**
 * Safe JSON parser
 */
const safeJsonParse = (value) => {
  if (!value) return null;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch (e) {
    return null;
  }
};

/**
 * Format model for response
 */
function formatModelForResponse(row) {
  const metrics = row.model_type === 'classification'
    ? {
        accuracy: row.accuracy,
        precision: row.precision,
        recall: row.recall,
        f1_score: row.f1_score,
        roc_auc: row.roc_auc,
      }
    : {
        r2_score: row.r2_score,
        mse: row.mse,
        rmse: row.rmse,
        mae: row.mae,
      };

  return {
    model_id: row.id,
    model_name: row.model_name,
    model: row.model_name,
    name: row.model_name,
    model_type: row.model_type,
    model_path: row.model_path,
    training_time_ms: row.training_time_ms,
    metrics,
    plots: {
      confusion_matrix: safeJsonParse(row.confusion_matrix),
      roc_curve: safeJsonParse(row.roc_curve),
      precision_recall_curve: safeJsonParse(row.precision_recall_curve),
      class_labels: safeJsonParse(row.class_labels),
      residuals: safeJsonParse(row.residuals),
      predicted_vs_actual: safeJsonParse(row.predicted_vs_actual),
      error_distribution: safeJsonParse(row.error_distribution),
      residual_vs_predicted: safeJsonParse(row.residual_vs_predicted),
      regression_line: safeJsonParse(row.regression_line),
    },
    feature_importance: safeJsonParse(row.feature_importance),
    status: 'success',
  };
}

/**
 * Get experiment results
 */
const getExperimentResults = async (experimentId, userId = null, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    const models = await getModelsByExperiment(experimentId, userId);
    if (models.length) {
      const formattedModels = models.map(formatModelForResponse);
      return {
        status: 'completed',
        experiment_id: experimentId,
        task_type: models[0].model_type,
        models: formattedModels,
        base_models: formattedModels,
        best_model: formattedModels[0],
      };
    }
    if (i < retries - 1) await new Promise((r) => setTimeout(r, 500));
  }
  return null;
};

/**
 * Get single model by ID
 */
const getModelById = async (modelId, userId = null) => {
  let query = `SELECT 
      tm.*,
      mp.confusion_matrix,
      mp.roc_curve,
      mp.precision_recall_curve,
      mp.class_labels,
      mp.residuals,
      mp.predicted_vs_actual,
      mp.error_distribution,
      mp.residual_vs_predicted,
      mp.regression_line,
      mp.feature_importance
     FROM trained_models tm
     LEFT JOIN model_plots mp ON tm.id = mp.model_id
     WHERE tm.id = ?`;
  const params = [modelId];
  
  if (userId) {
    query += ` AND tm.user_id = ?`;
    params.push(userId);
  }
  
  const [rows] = await pool.execute(query, params);
  return rows[0] ? formatModelForResponse(rows[0]) : null;
};

/**
 * Get multiple models by IDs
 */
const getModelsByIds = async (modelIds, userId = null) => {
  if (!modelIds || modelIds.length === 0) return [];
  
  const placeholders = modelIds.map(() => '?').join(',');
  let query = `SELECT 
      tm.*,
      mp.confusion_matrix,
      mp.roc_curve,
      mp.precision_recall_curve,
      mp.class_labels,
      mp.residuals,
      mp.predicted_vs_actual,
      mp.error_distribution,
      mp.residual_vs_predicted,
      mp.regression_line,
      mp.feature_importance
     FROM trained_models tm
     LEFT JOIN model_plots mp ON tm.id = mp.model_id
     WHERE tm.id IN (${placeholders})`;
  const params = [...modelIds];
  
  if (userId) {
    query += ` AND tm.user_id = ?`;
    params.push(userId);
  }
  
  const [rows] = await pool.execute(query, params);
  return rows.map(formatModelForResponse);
};

/**
 * Delete model
 */
const deleteModel = async (modelId) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const [rows] = await connection.execute(
      'SELECT model_path, model_name FROM trained_models WHERE id = ?',
      [modelId]
    );
    
    if (rows.length === 0) {
      throw new Error('Model not found');
    }
    
    const modelInfo = rows[0];
    
    // Delete from trained_models (cascade will delete from model_plots)
    await connection.execute('DELETE FROM trained_models WHERE id = ?', [modelId]);
    
    await connection.commit();
    logger.info('[DB]', `Deleted model ${modelId}`);
    
    return modelInfo;
  } catch (error) {
    await connection.rollback();
    logger.error('[DB]', 'Failed to delete model', { error: error.message });
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Create training job
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

/**
 * Update training job status
 */
const updateTrainingJobStatus = async (jobId, status, errorMessage = null) => {
  await pool.execute(
    "UPDATE training_jobs SET status = ?, error_message = ? WHERE id = ?",
    [status, errorMessage, jobId]
  );
};

/**
 * Get training job by experiment
 */
const getTrainingJobByExperiment = async (experimentId, userId = null) => {
  let query = `SELECT * FROM training_jobs
     WHERE pipeline_id = ? OR pipeline_id LIKE ?`;
  const params = [experimentId, `%${experimentId}%`];
  
  if (userId) {
    query += ` AND user_id = ?`;
    params.push(userId);
  }
  
  query += ` ORDER BY created_at DESC LIMIT 1`;
  
  const [rows] = await pool.execute(query, params);
  return rows[0] ?? null;
};

/**
 * List models with pagination and filtering
 */
const listModels = async (userId, options = {}) => {
  const { page = 1, limit = 10, modelType = null } = options;
  const offset = (page - 1) * limit;
  
  let query = `
    SELECT tm.*, mp.confusion_matrix, mp.roc_curve, mp.precision_recall_curve,
           mp.class_labels, mp.residuals, mp.predicted_vs_actual, mp.error_distribution,
           mp.residual_vs_predicted, mp.regression_line, mp.feature_importance
    FROM trained_models tm
    LEFT JOIN model_plots mp ON tm.id = mp.model_id
    WHERE tm.user_id = ?
  `;
  const params = [userId];
  
  if (modelType) {
    query += ` AND tm.model_type = ?`;
    params.push(modelType);
  }
  
  query += ` ORDER BY tm.created_at DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);
  
  const [rows] = await pool.execute(query, params);
  const [countRows] = await pool.execute(
    `SELECT COUNT(*) as total FROM trained_models WHERE user_id = ?` + 
    (modelType ? ` AND model_type = ?` : ''),
    modelType ? [userId, modelType] : [userId]
  );
  
  return {
    models: rows.map(formatModelForResponse),
    total: countRows[0].total,
    page: parseInt(page),
    limit: parseInt(limit),
  };
};

/**
 * Delete model and all artifacts
 */
const deleteModelAndArtifacts = async (modelId, userId) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const [rows] = await connection.execute(
      'SELECT model_path, model_name FROM trained_models WHERE id = ? AND user_id = ?',
      [modelId, userId]
    );
    
    if (rows.length === 0) {
      throw new Error('Model not found');
    }
    
    const modelInfo = rows[0];
    
    // Delete model file if exists
    if (modelInfo.model_path) {
      const fs = require('fs').promises;
      const path = require('path');
      const fullPath = path.isAbsolute(modelInfo.model_path) 
        ? modelInfo.model_path 
        : path.join(process.cwd(), modelInfo.model_path);
      
      try {
        await fs.unlink(fullPath);
        logger.info('[DB]', 'Model file deleted', { path: fullPath });
      } catch (err) {
        logger.warn('[DB]', 'Model file not found or already deleted', { path: fullPath });
      }
    }
    
    // Delete from database (cascade will handle model_plots)
    await connection.execute('DELETE FROM trained_models WHERE id = ?', [modelId]);
    
    await connection.commit();
    logger.info('[DB]', 'Deleted model and artifacts', { modelId, modelName: modelInfo.model_name });
    
    return modelInfo;
  } catch (error) {
    await connection.rollback();
    logger.error('[DB]', 'Failed to delete model', { error: error.message });
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  storeModelResults,
  getModelsByExperiment,
  getExperimentResults,
  getModelById,
  getModelsByIds,
  deleteModel,
  deleteModelAndArtifacts,
  listModels,
  createTrainingJob,
  updateTrainingJobStatus,
  getTrainingJobByExperiment,
};
