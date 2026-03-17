const express = require("express");
const router = express.Router();

const upload = require("../middlewares/upload.middleware");
const auth = require("../middlewares/authMiddleware");
const { validateDatasetUpload } = require("../middlewares/validation.middleware");
const {
  uploadDataset,
  preprocessDataset,
  undoLastStep,
  finalizeDataset,
  downloadDataset,
  getUserDatasets,
  resumeDataset,
  activateDataset,
  getPipelineSteps,
} = require("../controllers/dataset.controller");

// ── Existing routes (preserved) ─────────────────────
router.post("/upload", auth, upload.single("file"), validateDatasetUpload, uploadDataset);
router.post("/preprocess", auth, preprocessDataset);
router.post("/clean", auth, preprocessDataset);

// ── New pipeline routes ─────────────────────────────
router.get("/list", auth, getUserDatasets);
router.get("/:datasetId/steps", auth, getPipelineSteps);
router.post("/:datasetId/undo", auth, undoLastStep);
router.post("/:datasetId/finalize", auth, finalizeDataset);
router.get("/:datasetId/download", auth, downloadDataset);
router.post("/:datasetId/resume", auth, upload.single("file"), resumeDataset);
router.post("/:datasetId/activate", auth, activateDataset);

module.exports = router;