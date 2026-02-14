const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const {
  deleteProjectTypesByUser,
  insertProjectTypes
} = require("../Database/models/user/projectTypesModel");

// 🔐 Protect all routes
router.use(authMiddleware);

// =======================
// ✅ SAVE PROJECT TYPES
// =======================
router.post("/project-types", async (req, res) => {
  try {
    const userId = req.user.id; // ✅ from JWT only
    const { projectTypes } = req.body;

    // 1️⃣ Validation
    if (!Array.isArray(projectTypes)) {
      return res.status(400).json({
        error: "projectTypes must be an array"
      });
    }

    // 2️⃣ Remove existing project types
    await deleteProjectTypesByUser(userId);

    // 3️⃣ Insert new ones (if any)
    await insertProjectTypes(userId, projectTypes);

    return res.status(200).json({
      message: "Project types saved successfully"
    });

  } catch (err) {
    console.error("❌ Project Types Error:", err);
    return res.status(500).json({
      error: "Server error while saving project types"
    });
  }
});

module.exports = router;
