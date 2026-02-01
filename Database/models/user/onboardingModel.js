const db = require("../../db");

/**
 * Insert OR update onboarding data
 */
const upsertOnboarding = (
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
      ON DUPLICATE KEY UPDATE
        company = VALUES(company),
        profession = VALUES(profession),
        experience = VALUES(experience),
        industry = VALUES(industry),
        data_experience = VALUES(data_experience),
        primary_goal = VALUES(primary_goal),
        additional_info = VALUES(additional_info)
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

module.exports = {
  upsertOnboarding
};
