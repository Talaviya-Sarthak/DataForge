const express = require("express");
const router = express.Router();

const {
  insertUserPreferences,
  getPreferencesByUserId
} = require("../Database/models/user/preferencesModel");

// =======================
// ✅ ADD USER PREFERENCES
// =======================
router.post("/preferences", async (req, res) => {
  try {
    const { user_id, preferences } = req.body;

    /*
      preferences = [
        { preference_type: "DATA_TYPE", preference_value: "CSV" },
        { preference_type: "FEATURE", preference_value: "AutoML" }
      ]
    */

    if (!user_id || !Array.isArray(preferences) || preferences.length === 0) {
      return res.status(400).json({
        error: "user_id and preferences array are required"
      });
    }

    await insertUserPreferences(Number(user_id), preferences);

    res.status(201).json({
      message: "User preferences saved successfully"
    });

  } catch (err) {
    console.error("❌ Preferences Insert Error:", err);

    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        error: "Duplicate preference for this user"
      });
    }

    if (err.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({
        error: "Invalid user_id"
      });
    }

    res.status(500).json({
      error: "Server error while saving preferences"
    });
  }
});

// =======================
// ✅ GET USER PREFERENCES
// =======================
router.get("/preferences/:userId", async (req, res) => {
  try {
    const userId = Number(req.params.userId);

    const preferences = await getPreferencesByUserId(userId);

    res.status(200).json({
      user_id: userId,
      preferences
    });

  } catch (err) {
    console.error("❌ Preferences Fetch Error:", err);
    res.status(500).json({
      error: "Server error while fetching preferences"
    });
  }
});

module.exports = router;
