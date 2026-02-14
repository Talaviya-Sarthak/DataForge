const pool = require("../../db");
const bcrypt = require("bcrypt");

// =======================
// FIND USER BY EMAIL
// =======================
const findUserByEmail = async (email) => {
  const sql = `
    SELECT id, name, email, password
    FROM users
    WHERE email = ?
    LIMIT 1
  `;

  const [results] = await pool.execute(sql, [email]);
  return results.length ? results[0] : null;
};

// =======================
// COMPARE PASSWORD
// =======================
const comparePassword = (plainPassword, hashedPassword) => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

module.exports = {
  findUserByEmail,
  comparePassword
};
