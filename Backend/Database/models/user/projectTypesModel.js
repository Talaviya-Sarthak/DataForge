const pool = require("../../db");

/**
 * Remove all project types for a user
 */
const deleteProjectTypesByUser = async (userId) => {
  const sql = `
    DELETE FROM user_project_types
    WHERE user_id = ?
  `;

  const [result] = await pool.execute(sql, [userId]);
  return result;
};

/**
 * Insert multiple project types for a user
 */
const insertProjectTypes = async (userId, projectTypes) => {
  if (!projectTypes.length) return;

  const values = projectTypes.map(type => [userId, type]);

  const sql = `
    INSERT INTO user_project_types (user_id, project_type)
    VALUES ?
  `;

  const [result] = await pool.query(sql, [values]);
  return result;
};

module.exports = {
  deleteProjectTypesByUser,
  insertProjectTypes
};
