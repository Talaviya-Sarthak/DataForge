const db = require("../../db");

/**
 * Remove all project types for a user
 */
const deleteProjectTypesByUser = (userId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      DELETE FROM user_project_types
      WHERE user_id = ?
    `;

    db.query(sql, [userId], (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};

/**
 * Insert multiple project types for a user
 */
const insertProjectTypes = (userId, projectTypes) => {
  return new Promise((resolve, reject) => {
    if (!projectTypes.length) return resolve();

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

module.exports = {
  deleteProjectTypesByUser,
  insertProjectTypes
};
