const db = require("../../db");
const bcrypt = require("bcrypt");

/**
 * Find user by email
 * @param {string} email
 * @returns {Promise<object|null>}
 */
function findUserByEmail(email) {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM users WHERE email = ?";
    db.query(sql, [email], (err, results) => {
      if (err) return reject(err);
      resolve(results[0] || null);
    });
  });
}

/**
 * Compare passwords
 * @param {string} plainPassword
 * @param {string} hashedPassword
 * @returns {Promise<boolean>}
 */
function comparePassword(plainPassword, hashedPassword) {
  return bcrypt.compare(plainPassword, hashedPassword);
}

module.exports = {
  findUserByEmail,
  comparePassword
};
