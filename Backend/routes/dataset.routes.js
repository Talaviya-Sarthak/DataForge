const express = require("express");
const router = express.Router();

const upload = require("../middlewares/upload.middleware");
const auth = require("../middlewares/authMiddleware");
const datasetCtrl = require("../controllers/dataset.controller");

// ─────────────────────────────────────────────
// EXISTING ROUTES (backward-compatible)
// ─────────────────────────────────────────────
router.post("/upload", auth, upload.single("file"), datasetCtrl.uploadDataset);
router.post("/preprocess", auth, datasetCtrl.preprocessDataset);
router.post("/clean", auth, datasetCtrl.preprocessDataset);

// ─────────────────────────────────────────────
// NEW: Pipeline / Multi-dataset routes
// ─────────────────────────────────────────────
router.get("/user/list", auth, datasetCtrl.getUserDatasets);
router.get("/user/resumable", auth, datasetCtrl.getResumableDatasets);
router.get("/:datasetId/steps", auth, datasetCtrl.getDatasetSteps);
router.post("/:datasetId/undo", auth, datasetCtrl.undoStep);
router.post("/:datasetId/finalize", auth, datasetCtrl.finalizeDataset);
router.get("/:datasetId/download", auth, datasetCtrl.downloadDataset);
router.post("/:datasetId/resume", auth, upload.single("file"), datasetCtrl.resumeDataset);
router.post("/:datasetId/switch", auth, datasetCtrl.switchDataset);

module.exports = router;
