const db = require("../../db");
const bcrypt = require("bcrypt");

// =======================
// FIND USER BY EMAIL
// =======================
const findUserByEmail = (email) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT id, name, email, password
      FROM users
      WHERE email = ?
      LIMIT 1
    `;

    db.query(sql, [email], (err, results) => {
      if (err) return reject(err);
      resolve(results.length ? results[0] : null);
    });
  });
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
