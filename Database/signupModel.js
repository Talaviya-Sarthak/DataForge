const db = require("./db");

// 👉 Only database insertion here - returns Promise
const insertUser = (name, email, hashedPassword) => {
  return new Promise((resolve, reject) => {
    const sql = "INSERT INTO users(name, email, password) VALUES (?, ?, ?)";
    db.query(sql, [name, email, hashedPassword], (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};

module.exports = {
  insertUser
};
