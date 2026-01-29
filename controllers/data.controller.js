const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

const ML_BASE_URL = process.env.ML_BASE_URL;

// Upload CSV
exports.uploadDataset = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const formData = new FormData();
    formData.append("file", fs.createReadStream(req.file.path), req.file.originalname);

    const response = await axios.post(`${ML_BASE_URL}/data/upload`, formData, {
      headers: formData.getHeaders(),
    });

    res.status(200).json({
      message: "Dataset uploaded successfully",
      filename: req.file.filename,
      ...response.data,
    });
  } catch (err) {
    console.error("Upload Error:", err.message);
    res.status(500).json({ message: "Upload failed", error: err.response?.data?.detail || err.message });
  }
};

// Preprocess JSON
exports.preprocessDataset = async (req, res) => {
  try {
    const response = await axios.post(`${ML_BASE_URL}/data/preprocess`, req.body, {
      headers: { "Content-Type": "application/json" },
    });

    res.status(200).json({
      message: "Dataset preprocessed successfully",
      ...response.data,
    });
  } catch (err) {
    console.error("Preprocess Error:", err.message);
    res.status(500).json({ message: "Preprocess failed", error: err.response?.data?.detail || err.message });
  }
};
