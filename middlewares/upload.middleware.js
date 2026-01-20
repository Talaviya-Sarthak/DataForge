const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = process.env.UPLOAD_DIR || "uploads";
const maxSize = process.env.MAX_FILE_SIZE || 52428800;

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "text/csv") cb(null, true);
  else cb(new Error("Only CSV files are allowed"), false);
};

// **Export multer factory, not instance**
module.exports = multer({ storage, limits: { fileSize: maxSize }, fileFilter });
