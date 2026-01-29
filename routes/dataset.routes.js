const express = require("express");
const router = express.Router();

const upload = require("../middlewares/upload.middleware");
const {
  uploadDataset,
  preprocessDataset,
} = require("../controllers/dataset.controller");

// Upload CSV
router.post("/upload", upload.single("file"), uploadDataset);

// Preprocess dataset
router.post("/preprocess", preprocessDataset);

module.exports = router;
