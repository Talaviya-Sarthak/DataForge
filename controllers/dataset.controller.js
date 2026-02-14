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

    if (!req.user || !req.user.id) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const user_id = req.user.id;

    // Forward to ML service first to get metadata
    const mlResponse = await mlService.uploadDataset(req.file);

    // Extract metadata from ML service response
    const numericalColumns = Array.isArray(mlResponse.numerical_columns)
      ? mlResponse.numerical_columns
      : [];

    const categoricalColumns = Array.isArray(mlResponse.categorical_columns)
      ? mlResponse.categorical_columns
      : [];

    const column_names = [...numericalColumns, ...categoricalColumns];
    const total_rows = mlResponse.rows ?? 0;

    // Store metadata in database
    await datasetService.insertDatasetMetadata(
      user_id,
      req.file.originalname,
      column_names,
      total_rows
    );

    // Return response in format expected by frontend
    return res.status(200).json({
      data: mlResponse.data,
      rows: mlResponse.rows,
      columns: mlResponse.columns,
      numerical_columns: mlResponse.numerical_columns,
      categorical_columns: mlResponse.categorical_columns,
      statistics: mlResponse.statistics,
      message: "Dataset uploaded successfully",
      filename: req.file.originalname
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
    const { action, strategy, columns } = req.body;

    if (!action) {
      return res.status(400).json({ message: "Cleaning action is required" });
    }

    // Build transformations based on action type
    let transformations;
    
    if (action === "feature_selection" && strategy === "manual") {
      // For manual drop, pass columns directly
      transformations = [{
        strategy: "manual",
        columns: columns || []
      }];
    } else {
      // For other actions, map per column
      transformations = (columns || []).map(col => ({
        column: col,
        strategy: strategy || "auto",
      }));
    }

    // Build MLService pipeline payload
    const payload = {
      steps: [{
        step_index: 0,
        type: action,
        params: transformations,
      }],
      start_index: 0,
      stop_index: 0,
      preview_rows: 100,
    };

    try {
      const result = await mlService.preprocessDataset(payload);

      return res.status(200).json({
        message: "Dataset cleaned successfully",
        ...result,
      });
    } catch (mlError) {
      // Check if it's the "No dataset uploaded" error
      if (mlError.response?.data?.detail?.includes("No dataset uploaded")) {
        return res.status(400).json({
          message: "No dataset in memory. Please upload a dataset first.",
          error: "Dataset not found in MLService"
        });
      }
      
      throw mlError;
    }
  } catch (error) {
    console.error("❌ Preprocess Error:", error.message);
    return res.status(500).json({
      message: "Cleaning failed",
      error: error.message,
    });
  }
};
