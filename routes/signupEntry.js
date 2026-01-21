const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();

const { findUserByEmail } = require("../Database/signinModel");
const { insertUser } = require("../Database/signupModel");

// =======================
// ✅ SIGN UP
// =======================
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email and password are required" });
    }

    // 1️⃣ Check if email already exists
    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    // 2️⃣ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3️⃣ Insert user
    insertUser(name, email, hashedPassword, (err, result) => {
      if (err) {
        console.error("❌ Signup Insert Error:", err);
        return res.status(500).json({ error: "Failed to create account" });
      }

      return res.status(201).json({
        message: "Account created",
        user: {
          id: result?.insertId,
          name,
          email
        }
      });
    });
  } catch (err) {
    console.error("❌ Signup Error:", err);
    res.status(500).json({ error: "Server error during sign up" });
  }
});

module.exports = router;
