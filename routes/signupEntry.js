const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();

const { findUserByEmail } = require("../Database/signinModel");

// =======================
// ✅ SIGN IN
// =======================
router.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });

  } catch (err) {
    console.error("❌ Signin Error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

module.exports = router;
