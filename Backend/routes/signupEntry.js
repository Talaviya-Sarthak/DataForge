const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");

const { insertUser } = require("../Database/models/user/signupModel");
const { findUserByEmail } = require("../Database/models/user/signinModel");

// Bcrypt salt rounds from environment variable
const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10);

// =======================
// ✅ SIGNUP ROUTE
// =======================
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1️⃣ Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Name, email, and password are required"
      });
    }

    // 2️⃣ Check if email already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        error: "Email already registered"
      });
    }

    // 3️⃣ Hash password
    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    // 4️⃣ Insert user (NO username)
    const result = await insertUser(name, email, hashedPassword);

    // 5️⃣ Success
    return res.status(201).json({
      message: "Signup successful",
      user: {
        id: result.insertId,
        name,
        email
      }
    });

  } catch (err) {
    console.error("❌ Signup Error:", err);
    return res.status(500).json({
      error: "Server error during signup"
    });
  }
});

module.exports = router;
