const db = require("./db");

// 👉 Only database insertion here
const insertUser = (name, email, hashedPassword, callback) => {
  const sql = "INSERT INTO users(name, email, password) VALUES (?, ?, ?)";
  db.query(sql, [name, email, hashedPassword], callback);
};

module.exports = {
  insertUser
};
