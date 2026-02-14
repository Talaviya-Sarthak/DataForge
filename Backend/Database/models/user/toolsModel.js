const pool = require("../../db");

/**
 * Delete all tools for a user
 */
const deleteUserToolsByUser = async (userId) => {
  const sql = `
    DELETE FROM user_tools
    WHERE user_id = ?
  `;

  const [result] = await pool.execute(sql, [userId]);
  return result;
};

/**
 * Insert user tools
 */
const insertUserTools = async (userId, tools) => {
  if (!tools.length) return;

  const values = tools.map(tool => [userId, tool]);

  const sql = `
    INSERT INTO user_tools (user_id, tool_name)
    VALUES ?
  `;

  const [result] = await pool.query(sql, [values]);
  return result;
};

module.exports = {
  deleteUserToolsByUser,
  insertUserTools
};
