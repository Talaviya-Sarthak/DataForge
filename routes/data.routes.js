const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload.middleware");
const { uploadDataset, preprocessDataset } = require("../controllers/data.controller");

// Upload CSV
router.post("/upload", upload.single("file"), uploadDataset);

// Preprocess JSON
router.post("/preprocess", preprocessDataset);

module.exports = router;
