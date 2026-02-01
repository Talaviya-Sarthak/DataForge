const express = require("express");
const router = express.Router();

const {
  insertOnboarding,
  getOnboardingByUserId
} = require("../Database/models/user/onboardingModel");

// =======================
// ✅ TEST ROUTE (CONFIRM ROUTE IS LOADED)
// =======================
router.get("/onboarding/test", (req, res) => {
  res.send("✅ onboarding route working!");
});

// =======================
// ✅ CREATE ONBOARDING (DB INSERT)
// =======================
router.post("/onboarding", async (req, res) => {
  try {
    const {
      user_id,
      company,
      profession,
      experience,
      industry,
      data_experience,
      primary_goal,
      additional_info
    } = req.body;

    // 1️⃣ Validation
    if (!user_id) {
      return res.status(400).json({
        error: "user_id is required"
      });
    }

    // 2️⃣ Insert into DB
    const result = await insertOnboarding(
      Number(user_id),           // ✅ ensure integer
      company || null,
      profession || null,
      experience || null,
      industry || null,
      data_experience || null,
      primary_goal || null,
      additional_info || null
    );

    // 3️⃣ Success
    return res.status(201).json({
      message: "Onboarding data saved successfully",
      onboarding_id: result.insertId
    });

  } catch (err) {
    console.error("❌ Onboarding Insert Error:", err);

    // UNIQUE constraint violation (one onboarding per user)
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        error: "Onboarding already completed for this user"
      });
    }

    // Foreign key failure (user_id not in users table)
    if (err.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({
        error: "Invalid user_id (user does not exist)"
      });
    }

    return res.status(500).json({
      error: "Server error while saving onboarding data"
    });
  }
});

// =======================
// ✅ GET ONBOARDING BY USER
// =======================
router.get("/onboarding/:userId", async (req, res) => {
  try {
    const userId = Number(req.params.userId);

    const onboarding = await getOnboardingByUserId(userId);

    if (!onboarding) {
      return res.status(404).json({
        error: "Onboarding data not found"
      });
    }

    return res.status(200).json(onboarding);

  } catch (err) {
    console.error("❌ Onboarding Fetch Error:", err);
    return res.status(500).json({
      error: "Server error while fetching onboarding data"
    });
  }
});

module.exports = router;
