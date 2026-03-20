const express = require("express");
const router = express.Router();

const auth = require("../middlewares/authMiddleware");
const { trainingLimiter, pollingLimiter } = require("../middlewares/rateLimiter.middleware");
const {
  trainModel,
  getTrainingResults,
  getAvailableModels,
  experimentTrain,
  getExperiment,
  getExperimentPlots,
  listExperiments,
  getJobStatus,
  cancelJob,
  getQueueMetrics,
  getQueueStatus,
  getResults,
  getModelDetails,
  listModels,
  downloadModel,
  deleteModel,
  compareModels,
} = require("../controllers/training.controller");

// POST /api/training/train — kick off model training (legacy)
router.post("/train", auth, trainingLimiter, trainModel);

// GET /api/training/:pipelineId/results — fetch stored leaderboard
router.get("/:pipelineId/results", auth, getTrainingResults);

// ── NEW EXPERIMENT ENDPOINTS ────────────────────────────

// GET /api/training/models/available — list available models
router.get("/models/available", auth, getAvailableModels);

// POST /api/training/experiment/train — train without finalization (rate limited)
router.post("/experiment/train", auth, trainingLimiter, experimentTrain);

// GET /api/training/experiment/:experimentId — get experiment details (POLLING LIMITER)
router.get("/experiment/:experimentId", auth, pollingLimiter, getExperiment);

// GET /api/training/experiment/:experimentId/plots/:modelName — get model plots
router.get("/experiment/:experimentId/plots/:modelName", auth, getExperimentPlots);

// GET /api/training/experiments — list experiments
router.get("/experiments", auth, listExperiments);

// ── JOB MANAGEMENT ENDPOINTS ────────────────────────────

// GET /api/training/job/:jobId — get job status
router.get("/job/:jobId", auth, getJobStatus);

// DELETE /api/training/job/:jobId — cancel job
router.delete("/job/:jobId", auth, cancelJob);

// GET /api/training/queue/metrics — get queue metrics (admin)
router.get("/queue/metrics", auth, getQueueMetrics);

// GET /api/training/queue/status — get detailed queue status (BONUS)
router.get("/queue/status", auth, getQueueStatus);

// ── NEW DB-DRIVEN ENDPOINTS ────────────────────────────

// GET /api/training/results/:experimentId — fetch complete results from DB
router.get("/results/:experimentId", auth, getResults);

// GET /api/training/models/:modelId/details — get single model details
router.get("/models/:modelId/details", auth, getModelDetails);

// GET /api/training/models — list trained models with pagination
router.get("/models", auth, listModels);

// GET /api/training/models/:modelId/download — download trained model file
router.get("/models/:modelId/download", auth, downloadModel);

// DELETE /api/training/models/:modelId — manually delete a trained model
router.delete("/models/:modelId", auth, deleteModel);

// POST /api/training/models/compare — compare multiple models
router.post("/models/compare", auth, compareModels);

module.exports = router;
