const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const {
  deletePreferencesByUser,
  insertUserPreferences
} = require("../Database/models/user/preferencesModel");

// 🔐 Protect all routes
router.use(authMiddleware);

// =======================
// ✅ SAVE USER PREFERENCES
// =======================
router.post("/preferences", async (req, res) => {
  try {
    const userId = req.user.id; // ✅ from JWT only
    const {
      dataTypes = [],
      preferredFeatures = []
    } = req.body;

    // 1️⃣ Validation
    if (!Array.isArray(dataTypes) || !Array.isArray(preferredFeatures)) {
      return res.status(400).json({
        error: "dataTypes and preferredFeatures must be arrays"
      });
    }

    // 2️⃣ Remove existing preferences
    await deletePreferencesByUser(userId);

    // 3️⃣ Insert new preferences
    await insertUserPreferences(
      userId,
      dataTypes,
      preferredFeatures
    );

    return res.status(200).json({
      message: "Preferences saved successfully"
    });

  } catch (err) {
    return res.status(500).json({
      error: "Server error while saving preferences"
    });
  }
});

module.exports = router;
