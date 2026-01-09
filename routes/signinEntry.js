const express = require("express");
const router = express.Router();
const { findUserByEmail, comparePassword } = require("../Database/signinModel");

// TEST ROUTE
router.get("/test", (req, res) => {
  res.send("signinEntry route working!");
});

// SIGN IN
router.post("/signin", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    // 1️⃣ Check if user exists
    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // 2️⃣ Compare password with hashed password
    const isMatch = await comparePassword(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // 3️⃣ Success
    res.status(200).json({
      message: "Sign in successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });

  } catch (err) {
    console.error("❌ Signin Error:", err);
    res.status(500).json({ error: "Server error during sign in" });
  }
});

module.exports = router;
