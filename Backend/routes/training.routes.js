const express = require("express");
const router = express.Router();

const auth = require("../middlewares/authMiddleware");
const {
  trainModel,
  getTrainingResults,
} = require("../controllers/training.controller");

// POST /api/training/train — kick off model training
router.post("/train", auth, trainModel);

// GET /api/training/:pipelineId/results — fetch stored leaderboard
router.get("/:pipelineId/results", auth, getTrainingResults);

module.exports = router;
