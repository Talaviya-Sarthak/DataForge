const db = require("../../db");

/**
 * Delete all preferences for a user
 */
const deletePreferencesByUser = (userId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      DELETE FROM user_preferences
      WHERE user_id = ?
    `;

    db.query(sql, [userId], (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};

/**
 * Insert user preferences (DATA_TYPE + FEATURE)
 */
const insertUserPreferences = (userId, dataTypes, features) => {
  return new Promise((resolve, reject) => {
    const values = [
      ...dataTypes.map(d => [userId, "DATA_TYPE", d]),
      ...features.map(f => [userId, "FEATURE", f])
    ];

    if (!values.length) return resolve();

    const sql = `
      INSERT INTO user_preferences (user_id, preference_type, preference_value)
      VALUES ?
    `;

    db.query(sql, [values], (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};

module.exports = {
  deletePreferencesByUser,
  insertUserPreferences
};
