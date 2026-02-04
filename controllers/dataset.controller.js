const { v4: uuidv4 } = require("uuid");
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

    const mlResponse = await mlService.uploadDataset(req.file);

    const numericalColumns = Array.isArray(mlResponse.numerical_columns)
      ? mlResponse.numerical_columns
      : [];

    const categoricalColumns = Array.isArray(mlResponse.categorical_columns)
      ? mlResponse.categorical_columns
      : [];

    const dataset_uuid = uuidv4();
    const user_id = req.user?.id || 1;

    const column_names = [...numericalColumns, ...categoricalColumns];
    const total_rows = mlResponse.rows ?? 0;

    await datasetService.insertDatasetMetadata(
      dataset_uuid,
      user_id,
      req.file.originalname,
      column_names,
      total_rows
    );

    if (req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    return res.status(200).json({
      message: "Dataset uploaded & forwarded to ML service",
      dataset_uuid,
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

// ✅ THIS WAS MISSING — REQUIRED BY ROUTES
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
