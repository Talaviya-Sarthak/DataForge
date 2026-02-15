const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const {
  upsertOnboarding
} = require("../Database/models/user/onboardingModel");

// 🔐 Protect all onboarding routes
router.use(authMiddleware);

// =======================
// ✅ USER ONBOARDING
// =======================
router.post("/onboarding", async (req, res) => {
  try {
    const userId = req.user.id; // ✅ from JWT only

    const {
      company,
      profession,
      experience,
      industry,
      dataExperience,
      primaryGoal,
      additionalInfo
    } = req.body;

    await upsertOnboarding(
      userId,
      company,
      profession,
      experience,
      industry,
      dataExperience,
      primaryGoal,
      additionalInfo
    );

    return res.status(201).json({
      message: "Onboarding completed successfully"
    });

  } catch (err) {
    console.error("❌ Onboarding Error:", err);
    return res.status(500).json({
      error: "Server error during onboarding"
    });
  }
});

module.exports = router;
