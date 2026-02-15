const pool = require("../../db");

/**
 * Delete all preferences for a user
 */
const deletePreferencesByUser = async (userId) => {
  const sql = `
    DELETE FROM user_preferences
    WHERE user_id = ?
  `;

  const [result] = await pool.execute(sql, [userId]);
  return result;
};

/**
 * Insert user preferences (DATA_TYPE + FEATURE)
 */
const insertUserPreferences = async (userId, dataTypes, features) => {
  const values = [
    ...dataTypes.map(d => [userId, "DATA_TYPE", d]),
    ...features.map(f => [userId, "FEATURE", f])
  ];

  if (!values.length) return;

  const sql = `
    INSERT INTO user_preferences (user_id, preference_type, preference_value)
    VALUES ?
  `;

  const [result] = await pool.query(sql, [values]);
  return result;
};

module.exports = {
  deletePreferencesByUser,
  insertUserPreferences
};
