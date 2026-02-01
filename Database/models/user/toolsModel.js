const db = require("../../db");

/**
 * Delete all tools for a user
 */
const deleteUserToolsByUser = (userId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      DELETE FROM user_tools
      WHERE user_id = ?
    `;

    db.query(sql, [userId], (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};

/**
 * Insert user tools
 */
const insertUserTools = (userId, tools) => {
  return new Promise((resolve, reject) => {
    if (!tools.length) return resolve();

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

module.exports = {
  deleteUserToolsByUser,
  insertUserTools
};
