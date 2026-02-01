const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();

const { findUserByEmail } = require("../Database/models/user/signinModel");
const { insertUser } = require("../Database/models/user/signupModel");

// ✅ Sign up
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Name, email and password are required"
      });
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        error: "Email already registered"
      });
    }

    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const result = await insertUser(name, email, hashedPassword);

    res.status(201).json({
      message: "Account created successfully",
      user: {
        id: result.insertId,
        name,
        email
      }
    });

  } catch (err) {
    console.error("❌ Signup Error:", err);
    res.status(500).json({
      error: "Server error during sign up"
    });
  }
});

module.exports = router;
