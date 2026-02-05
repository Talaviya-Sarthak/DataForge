const fs = require("fs");
const mlService = require("../services/ml.service");
const datasetService = require("../services/dataset.service");

exports.uploadDataset = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded",
      });
    }

    // Forward to ML service first to get metadata
    const mlResponse = await mlService.uploadDataset(req.file);

    // Extract metadata from ML service response
    const numericalColumns = Array.isArray(mlResponse.numerical_columns)
      ? mlResponse.numerical_columns
      : [];

    const categoricalColumns = Array.isArray(mlResponse.categorical_columns)
      ? mlResponse.categorical_columns
      : [];

    const user_id = req.user?.id || 1;
    const column_names = [...numericalColumns, ...categoricalColumns];
    const total_rows = mlResponse.rows ?? 0;

    // Store metadata in database - use original filename since no disk storage
    await datasetService.insertDatasetMetadata(
      user_id,
      req.file.originalname,
      column_names,
      total_rows
    );

    // File is processed in memory and sent to ML service directly
    // No local file storage needed

    return res.status(200).json({
      message: "Dataset uploaded & forwarded to ML service",
      filename: req.file.originalname,
      ...mlResponse,
    });

  } catch (error) {
    console.error("Upload Error:", error);
    return res.status(500).json({
      message: "Dataset upload failed",
      error: error.message,
    });
  }
};

exports.preprocessDataset = async (req, res) => {
  try {
    const result = await mlService.preprocessDataset(req.body);

    return res.status(200).json({
      message: "Dataset preprocessed successfully",
      ...result,
    });
  } catch (error) {
    console.error("Preprocess Error:", error);
    return res.status(500).json({
      message: "Preprocess failed",
      error: error.message,
    });
  }
};
