const express = require("express");
const router = express.Router();

const {
  insertUserTools,
  getToolsByUserId
} = require("../Database/models/user/toolsModel");

// =======================
// ✅ ADD USER TOOLS
// =======================
router.post("/tools", async (req, res) => {
  try {
    const { user_id, tools } = req.body;

    if (!user_id || !Array.isArray(tools) || tools.length === 0) {
      return res.status(400).json({
        error: "user_id and tools array are required"
      });
    }

    await insertUserTools(Number(user_id), tools);

    res.status(201).json({
      message: "User tools saved successfully"
    });

  } catch (err) {
    console.error("❌ Tools Insert Error:", err);

    if (err.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({
        error: "Invalid user_id"
      });
    }

    res.status(500).json({
      error: "Server error while saving tools"
    });
  }
});

// =======================
// ✅ GET USER TOOLS
// =======================
router.get("/tools/:userId", async (req, res) => {
  try {
    const userId = Number(req.params.userId);

    const tools = await getToolsByUserId(userId);

    res.status(200).json({
      user_id: userId,
      tools
    });

  } catch (err) {
    console.error("❌ Tools Fetch Error:", err);
    res.status(500).json({
      error: "Server error while fetching tools"
    });
  }
});

module.exports = router;
