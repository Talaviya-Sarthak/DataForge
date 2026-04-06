const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const {
  upsertOnboarding,
  getOnboardingByUserId
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
    return res.status(500).json({
      error: "Server error during onboarding"
    });
  }
});

// =======================
// ✅ GET USER PROFILE SNAPSHOT
// =======================
router.get("/onboarding/profile", async (req, res) => {
  try {
    const userId = req.user.id;
    const onboarding = await getOnboardingByUserId(userId);

    return res.status(200).json({
      company: onboarding?.company || null,
      role: onboarding?.profession || null
    });
  } catch (err) {
    return res.status(500).json({
      error: "Server error while fetching onboarding profile"
    });
  }
});

module.exports = router;
