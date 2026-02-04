const pool = require("../Database/db");

/**
 * Insert dataset metadata
 * Duplicate datasets (same user_id + dataset_uuid) are ignored safely
 */
const insertDatasetMetadata = async (
  dataset_uuid,
  user_id,
  original_filename,
  column_names,
  total_rows
) => {
  const sql = `
    INSERT IGNORE INTO datasets
    (dataset_uuid, user_id, original_filename, column_names, total_rows)
    VALUES (?, ?, ?, ?, ?)
  `;

  const [result] = await pool.execute(sql, [
    dataset_uuid,
    user_id,
    original_filename,
    JSON.stringify(column_names),
    total_rows,
  ]);

  return result;
};

module.exports = {
  insertDatasetMetadata,
};
