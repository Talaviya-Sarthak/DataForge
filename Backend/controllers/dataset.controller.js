const fs = require("fs");
const mlService = require("../services/ml.service");
const datasetService = require("../services/dataset.service");
const pipelineEngine = require("../services/pipelineEngine.service");

// ═════════════════════════════════════════════
// UPLOAD DATASET
// ═════════════════════════════════════════════
exports.uploadDataset = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const user_id = req.user.id;

    // 1) Create dataset row in DB FIRST → get dataset_id
    const datasetId = await datasetService.createDataset(user_id, req.file.originalname);

    // 2) Upload to ML service with dataset_id (raw + working stored in ML memory)
    const mlResponse = await mlService.uploadDataset(req.file, user_id, datasetId);

    // 3) Update DB row with actual metadata from ML response
    const numericalColumns = Array.isArray(mlResponse.numerical_columns) ? mlResponse.numerical_columns : [];
    const categoricalColumns = Array.isArray(mlResponse.categorical_columns) ? mlResponse.categorical_columns : [];
    const column_names = [...numericalColumns, ...categoricalColumns];
    const total_rows = mlResponse.rows ?? 0;

    await datasetService.updateDatasetMetadata(datasetId, column_names, total_rows);

    // 4) Return response (backward-compatible + dataset_id)
    return res.status(200).json({
      success: true,
      dataset_id: datasetId,
      step_count: 0,
      data: mlResponse.data,
      rows: mlResponse.rows,
      columns: mlResponse.columns,
      numerical_columns: mlResponse.numerical_columns,
      categorical_columns: mlResponse.categorical_columns,
      statistics: mlResponse.statistics,
      message: "Dataset uploaded successfully",
      filename: req.file.originalname,
    });
  } catch (error) {
    console.error("Upload Error:", error);
    return res.status(500).json({ message: "Dataset upload failed", error: error.message });
  }
};

// ═════════════════════════════════════════════
// PREPROCESS DATASET (pipeline-aware)
// ═════════════════════════════════════════════
exports.preprocessDataset = async (req, res) => {
  try {
    const { action, strategy, columns } = req.body;
    if (!action) {
      return res.status(400).json({ message: "Cleaning action is required" });
    }

    const userId = req.user.id;

    // Resolve dataset_id: from body, or active dataset
    let datasetId = req.body.dataset_id;
    if (!datasetId) {
      const active = await datasetService.getActiveDataset(userId);
      if (!active) {
        return res.status(400).json({ message: "No active dataset found. Please upload a dataset first." });
      }
      datasetId = active.id;
    }

    // Build transformations (same logic as before)
    let transformations;
    if (action === "feature_selection" && strategy === "manual") {
      transformations = [{ strategy: "manual", columns: columns || [] }];
    } else {
      transformations = (columns || []).map((col) => ({
        column: col,
        strategy: strategy || "auto",
      }));
    }

    // 1) Save step metadata to DB
    const stepParams = { transformations };
    await pipelineEngine.addStep(datasetId, action, (columns || []).join(","), stepParams);

    // 2) Fetch ALL steps for this dataset
    const allSteps = await pipelineEngine.getStepsForDataset(datasetId);

    // 3) Build rebuild payload (always rebuild from raw)
    const rebuildPayload = pipelineEngine.buildRebuildPayload(allSteps, 100);
    rebuildPayload.dataset_id = datasetId;

    try {
      // 4) Send to ML service (deterministic rebuild from raw)
      const result = await mlService.preprocessDataset(rebuildPayload, userId);

      return res.status(200).json({
        success: true,
        message: "Dataset cleaned successfully",
        dataset_id: datasetId,
        step_count: allSteps.length,
        ...result,
      });
    } catch (mlError) {
      // ML failed → rollback the step we just saved so it doesn't
      // corrupt the pipeline on subsequent operations
      try {
        await pipelineEngine.removeLastStep(datasetId);
        console.log("🔄 Rolled back phantom step after ML failure");
      } catch (rollbackErr) {
        console.error("⚠️ Rollback failed:", rollbackErr.message);
      }

      if (mlError.response?.data?.detail?.includes("No dataset uploaded")) {
        return res.status(400).json({
          message: "No dataset in memory. Please upload a dataset first.",
          error: "Dataset not found in MLService",
        });
      }
      throw mlError;
    }
  } catch (error) {
    console.error("❌ Preprocess Error:", error.message);
    return res.status(500).json({ message: "Cleaning failed", error: error.message });
  }
};

// ═════════════════════════════════════════════
// UNDO LAST STEP
// ═════════════════════════════════════════════
exports.undoStep = async (req, res) => {
  try {
    const userId = req.user.id;
    let datasetId = parseInt(req.params.datasetId);

    // Ownership check
    const dataset = await datasetService.getDatasetById(datasetId, userId);
    if (!dataset) {
      return res.status(404).json({ message: "Dataset not found" });
    }

    // Remove last step from DB
    const undoResult = await pipelineEngine.removeLastStep(datasetId);
    if (!undoResult.removed) {
      return res.status(400).json({ message: "No steps to undo" });
    }

    // Fetch remaining steps
    const remainingSteps = await pipelineEngine.getStepsForDataset(datasetId);

    if (remainingSteps.length === 0) {
      // No steps left → rebuild means just returning the raw dataset preview
      // Send empty steps to ML service so it rebuilds from raw with no changes
      const rebuildPayload = {
        steps: [],
        start_index: 0,
        stop_index: null,
        preview_rows: 100,
        rebuild_from_raw: true,
        dataset_id: datasetId,
      };

      const result = await mlService.preprocessDataset(rebuildPayload, userId);
      return res.status(200).json({
        success: true,
        message: "Step undone. Dataset reset to original.",
        dataset_id: datasetId,
        step_count: 0,
        ...result,
      });
    }

    // Rebuild from raw + remaining steps
    const rebuildPayload = pipelineEngine.buildRebuildPayload(remainingSteps, 100);
    rebuildPayload.dataset_id = datasetId;

    const result = await mlService.preprocessDataset(rebuildPayload, userId);

    return res.status(200).json({
      success: true,
      message: "Step undone successfully",
      dataset_id: datasetId,
      step_count: remainingSteps.length,
      ...result,
    });
  } catch (error) {
    console.error("❌ Undo Error:", error.message);
    return res.status(500).json({ message: "Undo failed", error: error.message });
  }
};

// ═════════════════════════════════════════════
// FINALIZE DATASET
// ═════════════════════════════════════════════
exports.finalizeDataset = async (req, res) => {
  try {
    const userId = req.user.id;
    const datasetId = parseInt(req.params.datasetId);

    const dataset = await datasetService.getDatasetById(datasetId, userId);
    if (!dataset) {
      return res.status(404).json({ message: "Dataset not found" });
    }

    // Finalize in ML memory (raw = working)
    await mlService.finalizeDataset(userId, datasetId);

    // Update DB status
    await datasetService.updateDatasetStatus(datasetId, "completed");

    return res.status(200).json({
      success: true,
      message: "Dataset finalized successfully",
      dataset_id: datasetId,
      status: "completed",
    });
  } catch (error) {
    console.error("❌ Finalize Error:", error.message);
    return res.status(500).json({ message: "Finalize failed", error: error.message });
  }
};

// ═════════════════════════════════════════════
// DOWNLOAD DATASET
// ═════════════════════════════════════════════
exports.downloadDataset = async (req, res) => {
  try {
    const userId = req.user.id;
    const datasetId = parseInt(req.params.datasetId);

    const dataset = await datasetService.getDatasetById(datasetId, userId);
    if (!dataset) {
      return res.status(404).json({ message: "Dataset not found" });
    }

    const finalized = dataset.status === "completed";

    const mlResponse = await mlService.downloadDataset(userId, datasetId, finalized);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${dataset.original_filename}"`);
    mlResponse.data.pipe(res);
  } catch (error) {
    console.error("❌ Download Error:", error.message);
    return res.status(500).json({ message: "Download failed", error: error.message });
  }
};

// ═════════════════════════════════════════════
// LIST USER DATASETS
// ═════════════════════════════════════════════
exports.getUserDatasets = async (req, res) => {
  try {
    const userId = req.user.id;
    const datasets = await datasetService.getUserDatasets(userId);

    // Attach step count for each dataset
    const result = await Promise.all(
      datasets.map(async (ds) => ({
        ...ds,
        step_count: await pipelineEngine.getStepCount(ds.id),
        column_names: typeof ds.column_names === 'string' ? JSON.parse(ds.column_names) : ds.column_names,
      }))
    );

    return res.status(200).json({ success: true, datasets: result });
  } catch (error) {
    console.error("❌ List Datasets Error:", error.message);
    return res.status(500).json({ message: "Failed to list datasets", error: error.message });
  }
};

// ═════════════════════════════════════════════
// GET RESUMABLE DATASETS
// ═════════════════════════════════════════════
exports.getResumableDatasets = async (req, res) => {
  try {
    const userId = req.user.id;
    const datasets = await datasetService.getResumableDatasets(userId);

    const result = await Promise.all(
      datasets.map(async (ds) => ({
        ...ds,
        step_count: await pipelineEngine.getStepCount(ds.id),
        column_names: typeof ds.column_names === 'string' ? JSON.parse(ds.column_names) : ds.column_names,
      }))
    );

    return res.status(200).json({ success: true, datasets: result });
  } catch (error) {
    console.error("❌ Resumable Datasets Error:", error.message);
    return res.status(500).json({ message: "Failed to get resumable datasets", error: error.message });
  }
};

// ═════════════════════════════════════════════
// RESUME DATASET (re-upload + replay steps)
// ═════════════════════════════════════════════
exports.resumeDataset = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded for resume" });
    }

    const userId = req.user.id;
    const datasetId = parseInt(req.params.datasetId);

    const dataset = await datasetService.getDatasetById(datasetId, userId);
    if (!dataset) {
      return res.status(404).json({ message: "Dataset not found" });
    }

    // 1) Upload file to ML service (stores raw + working for this dataset_id)
    const mlUploadResponse = await mlService.uploadDataset(req.file, userId, datasetId);

    // 2) Validate schema: check if uploaded file has the required columns
    const storedColumns = typeof dataset.column_names === 'string' 
      ? JSON.parse(dataset.column_names) 
      : dataset.column_names;

    if (storedColumns && storedColumns.length > 0) {
      const schemaResult = await mlService.validateSchema(userId, datasetId, storedColumns);
      if (!schemaResult.valid) {
        // Clear the incompatible file from ML memory to prevent corruption
        await mlService.clearDataset(userId, datasetId);
        return res.status(400).json({
          message: "Schema mismatch: uploaded file is not compatible with the existing pipeline.",
          missing_columns: schemaResult.missing_columns,
        });
      }
    }

    // 3) Fetch all steps for this dataset
    const allSteps = await pipelineEngine.getStepsForDataset(datasetId);

    if (allSteps.length === 0) {
      // No steps to replay – just return the upload preview
      return res.status(200).json({
        success: true,
        message: "Dataset resumed (no steps to replay)",
        dataset_id: datasetId,
        step_count: 0,
        data: mlUploadResponse.data,
        rows: mlUploadResponse.rows,
        columns: mlUploadResponse.columns,
        numerical_columns: mlUploadResponse.numerical_columns,
        categorical_columns: mlUploadResponse.categorical_columns,
        statistics: mlUploadResponse.statistics,
      });
    }

    // 4) Rebuild from raw + all steps
    const rebuildPayload = pipelineEngine.buildRebuildPayload(allSteps, 100);
    rebuildPayload.dataset_id = datasetId;

    const result = await mlService.preprocessDataset(rebuildPayload, userId);

    // 5) Set this dataset as active
    await datasetService.setActiveDataset(userId, datasetId);

    return res.status(200).json({
      success: true,
      message: "Dataset resumed and pipeline replayed successfully",
      dataset_id: datasetId,
      step_count: allSteps.length,
      ...result,
    });
  } catch (error) {
    console.error("❌ Resume Error:", error.message);
    return res.status(500).json({ message: "Resume failed", error: error.message });
  }
};

// ═════════════════════════════════════════════
// GET PIPELINE STEPS for a dataset
// ═════════════════════════════════════════════
exports.getDatasetSteps = async (req, res) => {
  try {
    const userId = req.user.id;
    const datasetId = parseInt(req.params.datasetId);

    const dataset = await datasetService.getDatasetById(datasetId, userId);
    if (!dataset) {
      return res.status(404).json({ message: "Dataset not found" });
    }

    const steps = await pipelineEngine.getStepsForDataset(datasetId);

    return res.status(200).json({
      success: true,
      dataset_id: datasetId,
      steps,
    });
  } catch (error) {
    console.error("❌ Get Steps Error:", error.message);
    return res.status(500).json({ message: "Failed to get steps", error: error.message });
  }
};

// ═════════════════════════════════════════════
// SWITCH ACTIVE DATASET
// ═════════════════════════════════════════════
exports.switchDataset = async (req, res) => {
  try {
    const userId = req.user.id;
    const datasetId = parseInt(req.params.datasetId);

    const dataset = await datasetService.getDatasetById(datasetId, userId);
    if (!dataset) {
      return res.status(404).json({ message: "Dataset not found" });
    }

    await datasetService.setActiveDataset(userId, datasetId);

    return res.status(200).json({
      success: true,
      message: "Active dataset switched",
      dataset_id: datasetId,
    });
  } catch (error) {
    console.error("❌ Switch Error:", error.message);
    return res.status(500).json({ message: "Switch failed", error: error.message });
  }
};
