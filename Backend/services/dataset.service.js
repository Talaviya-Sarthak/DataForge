const pool = require("../Database/db");

// =========================================
// 1. DATASET METADATA
// =========================================

/**
 * Insert dataset metadata and auto-create a pipeline.
 * Ensures only one active dataset per user.
 * @returns {{ datasetId: number, pipelineId: number }}
 */
const insertDatasetMetadata = async (
  user_id,
  original_filename,
  column_names,
  total_rows
) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Set all existing datasets for this user to inactive
    await connection.execute(
      'UPDATE datasets SET is_active = FALSE WHERE user_id = ?',
      [user_id]
    );

    // Insert new active dataset with status
    const [datasetResult] = await connection.execute(
      `INSERT INTO datasets
       (user_id, original_filename, column_names, total_rows, is_active, status)
       VALUES (?, ?, ?, ?, TRUE, 'in_progress')`,
      [user_id, original_filename, JSON.stringify(column_names), total_rows]
    );
    const datasetId = datasetResult.insertId;

    // Auto-create a pipeline for this dataset
    const [pipelineResult] = await connection.execute(
      `INSERT INTO pipelines (user_id, dataset_id, pipeline_type, status)
       VALUES (?, ?, 'manual', 'draft')`,
      [user_id, datasetId]
    );
    const pipelineId = pipelineResult.insertId;

    await connection.commit();
    return { datasetId, pipelineId };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Update column_names and total_rows after ML service processes the file.
 */
const updateDatasetMetadata = async (datasetId, column_names, total_rows) => {
  await pool.execute(
    'UPDATE datasets SET column_names = ?, total_rows = ? WHERE id = ?',
    [JSON.stringify(column_names), total_rows, datasetId]
  );
};

// =========================================
// 2. DATASET QUERIES
// =========================================

const getActiveDataset = async (userId) => {
  const [rows] = await pool.execute(
    'SELECT * FROM datasets WHERE user_id = ? AND is_active = TRUE LIMIT 1',
    [userId]
  );
  return rows[0] || null;
};

const getDatasetById = async (datasetId) => {
  const [rows] = await pool.execute(
    'SELECT * FROM datasets WHERE id = ?',
    [datasetId]
  );
  return rows[0] || null;
};

const getUserDatasets = async (userId) => {
  const [rows] = await pool.execute(
    `SELECT d.*,
            p.id          AS pipeline_id,
            p.status      AS pipeline_status,
            p.total_steps AS total_steps
     FROM datasets d
     LEFT JOIN pipelines p
       ON p.dataset_id = d.id
       AND p.status NOT IN ('completed')
     WHERE d.user_id = ?
     ORDER BY d.created_at DESC`,
    [userId]
  );
  return rows;
};

const setActiveDataset = async (userId, datasetId) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute(
      'UPDATE datasets SET is_active = FALSE WHERE user_id = ?',
      [userId]
    );
    await connection.execute(
      'UPDATE datasets SET is_active = TRUE WHERE id = ? AND user_id = ?',
      [datasetId, userId]
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const updateDatasetStatus = async (datasetId, status) => {
  await pool.execute(
    'UPDATE datasets SET status = ? WHERE id = ?',
    [status, datasetId]
  );
};

// =========================================
// 3. PIPELINE QUERIES
// =========================================

/**
 * Get the most recent non-completed pipeline for a dataset.
 */
const getActivePipelineForDataset = async (datasetId) => {
  const [rows] = await pool.execute(
    `SELECT * FROM pipelines
     WHERE dataset_id = ? AND status NOT IN ('completed')
     ORDER BY created_at DESC LIMIT 1`,
    [datasetId]
  );
  return rows[0] || null;
};

/**
 * Return ALL steps for a pipeline, ordered by step_index.
 * Parses step_params from JSON string if needed.
 */
const getPipelineSteps = async (pipelineId) => {
  const [rows] = await pool.execute(
    'SELECT * FROM pipeline_steps WHERE pipeline_id = ? ORDER BY step_index ASC',
    [pipelineId]
  );
  return rows.map(row => ({
    ...row,
    step_params: typeof row.step_params === 'string'
      ? JSON.parse(row.step_params)
      : row.step_params,
  }));
};

// =========================================
// 4. PIPELINE STEP MUTATIONS
// =========================================

/**
 * Append a new step to the pipeline.
 * @returns {number} the newly assigned step_index
 */
const addPipelineStep = async (pipelineId, stepType, stepParams) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Get next step index
    const [indexRows] = await connection.execute(
      'SELECT COALESCE(MAX(step_index), -1) + 1 AS next_index FROM pipeline_steps WHERE pipeline_id = ?',
      [pipelineId]
    );
    const stepIndex = indexRows[0].next_index;

    const serialized = typeof stepParams === 'object'
      ? JSON.stringify(stepParams)
      : stepParams;

    await connection.execute(
      `INSERT INTO pipeline_steps
       (pipeline_id, step_index, step_type, step_params, status)
       VALUES (?, ?, ?, ?, 'completed')`,
      [pipelineId, stepIndex, stepType, serialized]
    );

    await connection.execute(
      'UPDATE pipelines SET total_steps = total_steps + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [pipelineId]
    );

    await connection.commit();
    return stepIndex;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Remove the last (highest step_index) step from a pipeline.
 * @returns {object|null} the removed step row, or null if no steps
 */
const removeLastPipelineStep = async (pipelineId) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [lastRows] = await connection.execute(
      'SELECT MAX(step_index) AS last_index FROM pipeline_steps WHERE pipeline_id = ?',
      [pipelineId]
    );
    const lastIndex = lastRows[0].last_index;

    if (lastIndex === null) {
      await connection.commit();
      return null; // nothing to undo
    }

    // Capture the step for return
    const [removedRows] = await connection.execute(
      'SELECT * FROM pipeline_steps WHERE pipeline_id = ? AND step_index = ?',
      [pipelineId, lastIndex]
    );

    // Delete it
    await connection.execute(
      'DELETE FROM pipeline_steps WHERE pipeline_id = ? AND step_index = ?',
      [pipelineId, lastIndex]
    );

    await connection.execute(
      'UPDATE pipelines SET total_steps = GREATEST(total_steps - 1, 0), updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [pipelineId]
    );

    await connection.commit();

    const removed = removedRows[0] || null;
    if (removed && typeof removed.step_params === 'string') {
      try { removed.step_params = JSON.parse(removed.step_params); } catch (_) { /* keep as-is */ }
    }
    return removed;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Update pipeline status (e.g. to 'completed').
 */
const updatePipelineStatus = async (pipelineId, status) => {
  await pool.execute(
    'UPDATE pipelines SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [status, pipelineId]
  );
};

// =========================================
// 5. SYSTEM INITIALIZATION
// =========================================

/**
 * Called once on server startup.
 * Marks any pipelines left in 'running' state as 'paused'
 * so they can be safely resumed.
 */
const initializeSystem = async () => {
  try {
    const [result] = await pool.execute(
      "UPDATE pipelines SET status = 'paused' WHERE status = 'running'"
    );
    if (result.affectedRows > 0) {
      console.log(`⚙️ Marked ${result.affectedRows} running pipelines as paused for recovery`);
    }
  } catch (error) {
    console.error('System initialization error:', error.message);
    throw error;
  }
};

module.exports = {
  insertDatasetMetadata,
  updateDatasetMetadata,
  getActiveDataset,
  getDatasetById,
  getUserDatasets,
  setActiveDataset,
  updateDatasetStatus,
  getActivePipelineForDataset,
  getPipelineSteps,
  addPipelineStep,
  removeLastPipelineStep,
  updatePipelineStatus,
  initializeSystem,
};
