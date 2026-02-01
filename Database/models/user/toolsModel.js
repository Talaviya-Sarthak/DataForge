const db = require("../../db");

/**
 * Insert multiple tools for a user
 */
const insertUserTools = (userId, tools) => {
  return new Promise((resolve, reject) => {
    const values = tools.map(tool => [userId, tool]);

    const sql = `
      INSERT INTO user_tools (user_id, tool_name)
      VALUES ?
    `;

    db.query(sql, [values], (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};

/**
 * Get tools by user
 */
const getToolsByUserId = (userId) => {
  return new Promise((resolve, reject) => {
    const sql = "SELECT tool_name FROM user_tools WHERE user_id = ?";
    db.query(sql, [userId], (err, results) => {
      if (err) return reject(err);
      resolve(results.map(r => r.tool_name));
    });
  });
};

module.exports = {
  insertUserTools,
  getToolsByUserId
};
