const db = require("../../db");

/**
 * Insert multiple preferences for a user
 */
const insertUserPreferences = (userId, preferences) => {
  return new Promise((resolve, reject) => {
    const values = preferences.map(p => [
      userId,
      p.preference_type,
      p.preference_value
    ]);

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

/**
 * Get preferences by user
 */
const getPreferencesByUserId = (userId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT preference_type, preference_value
      FROM user_preferences
      WHERE user_id = ?
    `;

    db.query(sql, [userId], (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

module.exports = {
  insertUserPreferences,
  getPreferencesByUserId
};
