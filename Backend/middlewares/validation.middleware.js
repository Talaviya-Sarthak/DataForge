/**
 * Dataset upload validation middleware.
 * Validates file size, type, structure, and sanitizes column names.
 */

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

/**
 * Validate uploaded CSV file before processing.
 * Must be used AFTER multer middleware (req.file is populated).
 */
const validateDatasetUpload = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      status: "error",
      message: "No file uploaded. Please select a CSV file.",
    });
  }

  // ── File size check ─────────────────────────
  if (req.file.size > MAX_FILE_SIZE) {
    return res.status(400).json({
      status: "error",
      message: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB. Your file is ${(req.file.size / (1024 * 1024)).toFixed(2)}MB.`,
    });
  }

  // ── File type check ─────────────────────────
  const allowedMimes = ["text/csv", "application/vnd.ms-excel"];
  const ext = req.file.originalname.toLowerCase().split(".").pop();

  if (!allowedMimes.includes(req.file.mimetype) && ext !== "csv") {
    return res.status(400).json({
      status: "error",
      message: "Only CSV files are allowed. Please upload a .csv file.",
    });
  }

  // ── Basic CSV structure validation ──────────
  try {
    const content = req.file.buffer.toString("utf-8");
    const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);

    if (lines.length < 2) {
      return res.status(400).json({
        status: "error",
        message: "CSV file must have at least a header row and one data row.",
      });
    }

    // Parse header
    const headers = parseCSVLine(lines[0]);

    if (headers.length < 2) {
      return res.status(400).json({
        status: "error",
        message: "Dataset must have at least 2 columns.",
      });
    }

    // Check for empty headers
    const emptyHeaders = headers.filter((h) => !h.trim());
    if (emptyHeaders.length > 0) {
      return res.status(400).json({
        status: "error",
        message: `Found ${emptyHeaders.length} empty column header(s). All columns must have names.`,
      });
    }

    // Check duplicate headers
    const lowerHeaders = headers.map((h) => h.trim().toLowerCase());
    const duplicates = lowerHeaders.filter((h, i) => lowerHeaders.indexOf(h) !== i);
    if (duplicates.length > 0) {
      return res.status(400).json({
        status: "error",
        message: `Duplicate column names found: ${[...new Set(duplicates)].join(", ")}. Column names must be unique.`,
      });
    }
  } catch (err) {
    return res.status(400).json({
      status: "error",
      message: "Failed to parse CSV file. Please ensure it is a valid CSV.",
    });
  }

  next();
};

/**
 * Simple CSV line parser that handles quoted fields.
 */
function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

module.exports = { validateDatasetUpload };
