const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Root@280",
  database: "dataforge"
});

db.connect((err) => {
  if (err) {
    console.error("❌ MySQL connection failed:", err);
  } else {
    console.log("✅ MySQL connected successfully");
  }
});

// Confirm which DB Node is using
db.query("SELECT DATABASE()", (err, result) => {
  if (err) console.log(err);
  else console.log("🗄 Node connected to DB:", result);
});

module.exports = db;



// Schema for reference
// CREATE TABLE users_data (
//     id INT NOT NULL AUTO_INCREMENT,
//     name VARCHAR(50) NOT NULL,
//     email VARCHAR(150) NOT NULL,
//     password VARCHAR(255) NOT NULL,
//     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//     PRIMARY KEY (id),
//     UNIQUE (email)
// );

