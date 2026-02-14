const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

const {
  findUserByEmail,
  comparePassword
} = require("../Database/models/user/signinModel");

// =======================
// ✅ SIGNIN ROUTE
// =======================
router.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1️⃣ Validation
    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required"
      });
    }

    // 2️⃣ Find user
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        error: "Invalid credentials"
      });
    }

    // 3️⃣ Compare password
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        error: "Invalid credentials"
      });
    }

    // 4️⃣ Generate JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // 5️⃣ Success
    return res.status(200).json({
      message: "Signin successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });

  } catch (err) {
    console.error("❌ Signin Error:", err);
    return res.status(500).json({
      error: "Internal server error"
    });
  }
});

module.exports = router;
