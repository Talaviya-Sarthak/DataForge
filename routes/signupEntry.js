const express = require("express");
const router = express.Router();
const db = require("../db");

// TEST ROUTE
router.get("/test", (req, res) => {
  res.send("Auth route is working!");
});


// ========================
// SIGNUP API
// POST /api/auth/signup
// ========================
router.post("/signup", (req, res) => {
  const { name, email, password } = req.body;

  console.log("📥 Signup Request:", req.body);

  if (!name || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  // Check if email already exists
  const checkSql = "SELECT id FROM users WHERE email = ?";
  db.query(checkSql, [email], (err, results) => {
    if (err) {
      console.error("❌ Check Error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (results.length > 0) {
      return res.status(409).json({ error: "This email is already registered" });
    }

    // Insert new user
    const insertSql =
      "INSERT INTO users(name, email, password) VALUES (?, ?, ?)";
    console.log("🔥 Running SQL:", insertSql);

    db.query(insertSql, [name, email, password], (err, result) => {
      if (err) {
        console.error("❌ Insert Error:", err);
        return res.status(500).json({ error: "Database insert failed" });
      }

      res.status(201).json({
        message: "Signup successful",
        userId: result.insertId,
      });
    });
  });
});


// ========================
// LOGIN API
// POST /api/auth/login
// ========================
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  console.log("📥 Login Request:", req.body);

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const sql = "SELECT * FROM users WHERE email = ?";
  db.query(sql, [email], (err, results) => {
    if (err) {
      console.error("❌ Login Error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = results[0];

    // ⚠️ For now: plain password check (later we can add bcrypt)
    if (user.password !== password) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  });
});

module.exports = router;
