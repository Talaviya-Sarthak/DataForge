const express = require("express");
const router = express.Router(); // Must be here first
const upload = require("../middlewares/upload.middleware");
const { uploadDataset } = require("../controllers/dataset.controller");

// POST /api/datasets/upload
router.post("/upload", upload.single("file"), uploadDataset);

module.exports = router;
