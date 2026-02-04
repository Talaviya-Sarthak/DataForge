const pool = require("../../db");

/**
 * Insert new user into users table
 * username is NOT handled here
 */
const insertUser = async (name, email, hashedPassword) => {
  const sql = `
    INSERT INTO users (name, email, password)
    VALUES (?, ?, ?)
  `;

  const [result] = await pool.execute(sql, [name, email, hashedPassword]);
  return result;
};

module.exports = {
  insertUser
};
