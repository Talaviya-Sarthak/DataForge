const db = require("./db");  
const bcrypt = require("bcrypt");

// Find user by email
function findUserByEmail(email) {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM users WHERE email = ?";
    db.query(sql, [email], (err, results) => {
      if (err) return reject(err);

      if (results.length === 0) {
        resolve(null);   // no user found
      } else {
        resolve(results[0]); // return single user object
      }
    });
  });
}

// Compare entered password with hashed password
function comparePassword(plainPassword, hashedPassword) {
  return bcrypt.compare(plainPassword, hashedPassword);
}

module.exports = { findUserByEmail, comparePassword };
