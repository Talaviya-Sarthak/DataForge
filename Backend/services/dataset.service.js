const pool = require("../Database/db");

/**
 * Dataset Service – manages dataset metadata in the DB.
 * NEVER stores actual dataset content.
 */

// ─────────────────────────────────────────────
// CREATE dataset row (returns id) – used before ML upload
// ─────────────────────────────────────────────
const createDataset = async (user_id, original_filename) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Deactivate existing active datasets for this user
    await connection.execute(
      'UPDATE datasets SET is_active = FALSE WHERE user_id = ?',
      [user_id]
    );

    // Insert with placeholder metadata (updated after ML processes)
    const [result] = await connection.execute(
      `INSERT INTO datasets
       (user_id, original_filename, column_names, total_rows, is_active, status)
       VALUES (?, ?, '[]', 0, TRUE, 'in_progress')`,
      [user_id, original_filename]
    );

    await connection.commit();
    return result.insertId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// ─────────────────────────────────────────────
// UPDATE metadata after ML service returns stats
// ─────────────────────────────────────────────
const updateDatasetMetadata = async (datasetId, column_names, total_rows) => {
  await pool.execute(
    'UPDATE datasets SET column_names = ?, total_rows = ? WHERE id = ?',
    [JSON.stringify(column_names), total_rows, datasetId]
  );
};

// ─────────────────────────────────────────────
// LEGACY: insert + set active (kept for backward compat)
// ─────────────────────────────────────────────
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
    
    // Insert new active dataset
    const sql = `
      INSERT INTO datasets
      (user_id, original_filename, column_names, total_rows, is_active, status)
      VALUES (?, ?, ?, ?, TRUE, 'in_progress')
    `;

    const [result] = await connection.execute(sql, [
      user_id,
      original_filename,
      JSON.stringify(column_names),
      total_rows,
    ]);

    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// ─────────────────────────────────────────────
// GET active dataset for a user
// ─────────────────────────────────────────────
const getActiveDataset = async (user_id) => {
  const [rows] = await pool.execute(
    'SELECT * FROM datasets WHERE user_id = ? AND is_active = TRUE LIMIT 1',
    [user_id]
  );
  return rows[0] || null;
};

// ─────────────────────────────────────────────
// GET dataset by id (with ownership check)
// ─────────────────────────────────────────────
const getDatasetById = async (datasetId, user_id) => {
  const [rows] = await pool.execute(
    'SELECT * FROM datasets WHERE id = ? AND user_id = ?',
    [datasetId, user_id]
  );
  return rows[0] || null;
};

// ─────────────────────────────────────────────
// GET all datasets for a user
// ─────────────────────────────────────────────
const getUserDatasets = async (user_id) => {
  const [rows] = await pool.execute(
    'SELECT * FROM datasets WHERE user_id = ? ORDER BY created_at DESC',
    [user_id]
  );
  return rows;
};

// ─────────────────────────────────────────────
// GET resumable datasets (in_progress)
// ─────────────────────────────────────────────
const getResumableDatasets = async (user_id) => {
  const [rows] = await pool.execute(
    "SELECT * FROM datasets WHERE user_id = ? AND status = 'in_progress' ORDER BY created_at DESC",
    [user_id]
  );
  return rows;
};

// ─────────────────────────────────────────────
// UPDATE status
// ─────────────────────────────────────────────
const updateDatasetStatus = async (datasetId, status) => {
  await pool.execute(
    'UPDATE datasets SET status = ? WHERE id = ?',
    [status, datasetId]
  );
};

// ─────────────────────────────────────────────
// SET active dataset (deactivate others)
// ─────────────────────────────────────────────
const setActiveDataset = async (user_id, datasetId) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute(
      'UPDATE datasets SET is_active = FALSE WHERE user_id = ?',
      [user_id]
    );
    await connection.execute(
      'UPDATE datasets SET is_active = TRUE WHERE id = ? AND user_id = ?',
      [datasetId, user_id]
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  createDataset,
  updateDatasetMetadata,
  insertDatasetMetadata,
  getActiveDataset,
  getDatasetById,
  getUserDatasets,
  getResumableDatasets,
  updateDatasetStatus,
  setActiveDataset,
};
