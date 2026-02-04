const express = require("express");
const router = express.Router();

const upload = require("../middlewares/upload.middleware");
const {
  uploadDataset,
  preprocessDataset,
} = require("../controllers/dataset.controller");

router.post("/upload", upload.single("file"), uploadDataset);
router.post("/preprocess", preprocessDataset);

module.exports = router;
