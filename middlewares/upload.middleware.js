const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = process.env.UPLOAD_DIR;
const maxSize = process.env.MAX_FILE_SIZE;

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});

const allowedMimeTypes = process.env.ALLOWED_FILE_TYPES.split(",").map(t => t.trim());

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) cb(null, true);
  else cb(new Error(`Only ${allowedMimeTypes.join(", ")} files are allowed`), false);
};

// **Export multer factory, not instance**
module.exports = multer({ storage, limits: { fileSize: maxSize }, fileFilter });
