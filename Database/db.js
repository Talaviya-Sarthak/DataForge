const mysql = require("mysql2");

let db = null;

if (process.env.USE_DB === "true") {
  db = mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "dataforge",
  });

  db.connect((err) => {
    if (err) {
      console.error("❌ MySQL Connection Failed:", err.message);
    } else {
      console.log("✅ MySQL connected successfully");
    }
  });
} else {
  console.log("⚠️ MySQL disabled (USE_DB=false)");
}

module.exports = db;