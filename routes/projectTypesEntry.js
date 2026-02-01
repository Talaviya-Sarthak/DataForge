const express = require("express");
const router = express.Router();

const {
  insertProjectTypes,
  getProjectTypesByUserId
} = require("../Database/models/user/projectTypesModel");

// =======================
// ✅ ADD PROJECT TYPES
// =======================
router.post("/project-types", async (req, res) => {
  try {
    const { user_id, project_types } = req.body;

    if (!user_id || !Array.isArray(project_types) || project_types.length === 0) {
      return res.status(400).json({
        error: "user_id and project_types array are required"
      });
    }

    await insertProjectTypes(Number(user_id), project_types);

    res.status(201).json({
      message: "Project types saved successfully"
    });

  } catch (err) {
    console.error("❌ Project Types Insert Error:", err);

    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        error: "Duplicate project type for this user"
      });
    }

    if (err.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({
        error: "Invalid user_id"
      });
    }

    res.status(500).json({
      error: "Server error while saving project types"
    });
  }
});

// =======================
// ✅ GET PROJECT TYPES
// =======================
router.get("/project-types/:userId", async (req, res) => {
  try {
    const userId = Number(req.params.userId);

    const projectTypes = await getProjectTypesByUserId(userId);

    res.status(200).json({
      user_id: userId,
      project_types: projectTypes
    });

  } catch (err) {
    console.error("❌ Project Types Fetch Error:", err);
    res.status(500).json({
      error: "Server error while fetching project types"
    });
  }
});

// 🔴 THIS LINE IS CRITICAL
module.exports = router;
