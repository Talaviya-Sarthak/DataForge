const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const {
  deleteUserToolsByUser,
  insertUserTools
} = require("../Database/models/user/toolsModel");

// 🔐 Protect all routes
router.use(authMiddleware);

// =======================
// ✅ SAVE USER TOOLS
// =======================
router.post("/tools", async (req, res) => {
  try {
    const userId = req.user.id; // ✅ from JWT only
    const { tools } = req.body;

    // 1️⃣ Validation
    if (!Array.isArray(tools)) {
      return res.status(400).json({
        error: "tools must be an array"
      });
    }

    // 2️⃣ Remove existing tools
    await deleteUserToolsByUser(userId);

    // 3️⃣ Insert new tools
    await insertUserTools(userId, tools);

    return res.status(200).json({
      message: "Tools saved successfully"
    });

  } catch (err) {
    console.error("❌ Tools Error:", err);
    return res.status(500).json({
      error: "Server error while saving tools"
    });
  }
});

module.exports = router;
