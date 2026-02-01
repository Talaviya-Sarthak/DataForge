const db = require("../../db");

/**
 * Insert multiple project types for a user
 */
const insertProjectTypes = (userId, projectTypes) => {
  return new Promise((resolve, reject) => {
    const values = projectTypes.map(type => [userId, type]);

    const sql = `
      INSERT INTO user_project_types (user_id, project_type)
      VALUES ?
    `;

    db.query(sql, [values], (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};

/**
 * Get project types by user
 */
const getProjectTypesByUserId = (userId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT project_type
      FROM user_project_types
      WHERE user_id = ?
    `;

    db.query(sql, [userId], (err, results) => {
      if (err) return reject(err);
      resolve(results.map(r => r.project_type));
    });
  });
};

module.exports = {
  insertProjectTypes,
  getProjectTypesByUserId
};
