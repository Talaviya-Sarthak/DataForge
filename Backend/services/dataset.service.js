const pool = require("../Database/db");

/**
 * Insert dataset metadata
 * Ensures only one active dataset per user
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
    
    // Insert new active dataset
    const sql = `
      INSERT INTO datasets
      (user_id, original_filename, column_names, total_rows, is_active)
      VALUES (?, ?, ?, ?, TRUE)
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

module.exports = {
  insertDatasetMetadata,
};
