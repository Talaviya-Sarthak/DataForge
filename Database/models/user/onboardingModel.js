const db = require("../../db");

/**
 * Insert onboarding data (one-time per user)
 */
const insertOnboarding = (
  userId,
  company,
  profession,
  experience,
  industry,
  dataExperience,
  primaryGoal,
  additionalInfo
) => {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO user_onboarding
      (user_id, company, profession, experience, industry, data_experience, primary_goal, additional_info)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
      sql,
      [
        userId,
        company,
        profession,
        experience,
        industry,
        dataExperience,
        primaryGoal,
        additionalInfo
      ],
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
  });
};

/**
 * Get onboarding data for a user
 */
const getOnboardingByUserId = (userId) => {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM user_onboarding WHERE user_id = ?";
    db.query(sql, [userId], (err, results) => {
      if (err) return reject(err);
      resolve(results[0] || null);
    });
  });
};

module.exports = {
  insertOnboarding,
  getOnboardingByUserId
};
