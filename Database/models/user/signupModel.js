const db = require("../../db");

/**
 * Insert new user
 * @param {string} name
 * @param {string} email
 * @param {string} hashedPassword
 * @returns {Promise<object>}
 */
const insertUser = (name, email, hashedPassword) => {
  return new Promise((resolve, reject) => {
    const sql = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";
    db.query(sql, [name, email, hashedPassword], (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};

module.exports = {
  insertUser
};
