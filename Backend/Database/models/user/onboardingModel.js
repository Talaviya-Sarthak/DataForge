const pool = require("../../db");

const upsertOnboarding = async (
  userId,
  company,
  profession,
  experience,
  industry,
  dataExperience,
  primaryGoal,
  additionalInfo
) => {
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

  const [result] = await pool.execute(
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
    ]
  );
  return result;
};

const getOnboardingByUserId = async (userId) => {
  const sql = `
    SELECT company, profession
    FROM user_onboarding
    WHERE user_id = ?
    LIMIT 1
  `;

  const [results] = await pool.execute(sql, [userId]);
  return results.length ? results[0] : null;
};

module.exports = {
  upsertOnboarding,
  getOnboardingByUserId
};
