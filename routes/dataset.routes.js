const express = require("express");
const router = express.Router();

const upload = require("../middlewares/upload.middleware");
const auth = require("../middlewares/authMiddleware");
const {
  uploadDataset,
  preprocessDataset,
} = require("../controllers/dataset.controller");

router.post("/upload", auth, upload.single("file"), uploadDataset);
router.post("/preprocess", auth, preprocessDataset);

module.exports = router;
