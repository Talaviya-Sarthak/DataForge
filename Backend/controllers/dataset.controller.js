const mlService = require("../services/ml.service");
const datasetService = require("../services/dataset.service");
const datasetCache = require("../services/dataset.cache");

// =========================================
// 1. UPLOAD  –  POST /api/datasets/upload
// =========================================
exports.uploadDataset = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const user_id = req.user.id;

    // 1. Create dataset + pipeline row (placeholder metadata)
    const { datasetId, pipelineId } = await datasetService.insertDatasetMetadata(
      user_id,
      req.file.originalname,
      [],   // column_names — updated below
      0     // total_rows  — updated below
    );

    // 2. Forward file to ML service with the real dataset_id
    const mlResponse = await mlService.uploadDataset(req.file, user_id, datasetId);

    // 2b. Cache raw dataset buffer for worker-side rehydration
    await datasetCache.set(user_id, datasetId, req.file);

    // 3. Update dataset metadata with actual values from ML
    const numericalColumns = Array.isArray(mlResponse.numerical_columns)
      ? mlResponse.numerical_columns : [];
    const categoricalColumns = Array.isArray(mlResponse.categorical_columns)
      ? mlResponse.categorical_columns : [];
    const column_names = [...numericalColumns, ...categoricalColumns];
    const total_rows = mlResponse.rows ?? 0;

    await datasetService.updateDatasetMetadata(datasetId, column_names, total_rows);

    // 4. Return response in format expected by frontend
    return res.status(200).json({
      data: mlResponse.data,
      rows: mlResponse.rows,
      columns: mlResponse.columns,
      numerical_columns: mlResponse.numerical_columns,
      categorical_columns: mlResponse.categorical_columns,
      statistics: mlResponse.statistics,
      message: "Dataset uploaded successfully",
      filename: req.file.originalname,
      dataset_id: datasetId,
      pipeline_id: pipelineId,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Dataset upload failed",
      error: error.message,
    });
  }
};

// =========================================
// 2. PREPROCESS (CLEAN) – POST /api/datasets/clean
//    Pipeline-integrated rebuild approach:
//    • store step in DB
//    • replay ALL steps from raw
//    • return preview
// =========================================
exports.preprocessDataset = async (req, res) => {
  try {
    const { action, strategy, columns, dataset_id: reqDatasetId } = req.body;
    const userId = req.user.id;

    if (!action) {
      return res.status(400).json({ message: "Cleaning action is required" });
    }

    // ── Resolve dataset & pipeline ──────────────
    let datasetId = reqDatasetId;
    if (!datasetId) {
      const active = await datasetService.getActiveDataset(userId);
      if (!active) {
        return res.status(400).json({
          message: "No active dataset found. Please upload a dataset first.",
        });
      }
      datasetId = active.id;
    }

    const pipeline = await datasetService.getActivePipelineForDataset(datasetId);
    if (!pipeline) {
      return res.status(400).json({ message: "No active pipeline found for this dataset." });
    }

    // ── Build step params ───────────────────────
    let transformations;
    if (action === "feature_selection" && strategy === "manual") {
      transformations = [{ strategy: "manual", columns: columns || [] }];
    } else if (action === "drop_duplicates" || action === "replace_values") {
      // Dataset-level operations — no per-column params needed
      transformations = [{ strategy: strategy || "auto" }];
    } else {
      transformations = (columns || []).map(col => ({
        column: col,
        strategy: strategy || "auto",
      }));
    }

    // ── Get existing steps ──────────────────────
    const existingSteps = await datasetService.getPipelineSteps(pipeline.id);

    // Build the NEW step (not yet persisted)
    const newStepIndex = existingSteps.length > 0
      ? existingSteps[existingSteps.length - 1].step_index + 1
      : 0;

    const newStep = {
      step_index: newStepIndex,
      type: action,
      params: transformations,
    };

    // ── ML payload: ALL existing steps + new step ─
    const allStepsForML = [
      ...existingSteps.map(s => ({
        step_index: s.step_index,
        type: s.step_type,
        params: s.step_params,
      })),
      newStep,
    ];

    const mlPayload = {
      user_id: userId,
      dataset_id: datasetId,
      steps: allStepsForML,
      start_index: 0,
      preview_rows: 100,
    };

    // ── Call ML service (rebuild from raw) ──────
    let result;
    try {
      result = await mlService.preprocessDataset(mlPayload, userId);
    } catch (mlError) {
      // If ML fails, don't persist the step
      if (mlError.response?.data?.detail?.includes("No dataset uploaded")) {
        return res.status(400).json({
          message: "No dataset in memory. Please upload a dataset first.",
          error: "Dataset not found in MLService",
        });
      }
      throw mlError;
    }

    // ── ML succeeded → persist the step ─────────
    await datasetService.addPipelineStep(pipeline.id, action, transformations);

    return res.status(200).json({
      message: "Dataset cleaned successfully",
      ...result,
      total_steps: allStepsForML.length,
      dataset_id: datasetId,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Cleaning failed",
      error: error.message,
    });
  }
};

// =========================================
// 3. UNDO  –  POST /api/datasets/:datasetId/undo
// =========================================
exports.undoLastStep = async (req, res) => {
  try {
    const userId = req.user.id;
    const datasetId = parseInt(req.params.datasetId);

    const pipeline = await datasetService.getActivePipelineForDataset(datasetId);
    if (!pipeline) {
      return res.status(400).json({ message: "No active pipeline found." });
    }

    // Remove last step from DB
    const removed = await datasetService.removeLastPipelineStep(pipeline.id);

    // Rebuild with remaining steps
    const allSteps = await datasetService.getPipelineSteps(pipeline.id);

    const mlPayload = {
      user_id: userId,
      dataset_id: datasetId,
      steps: allSteps.map(s => ({
        step_index: s.step_index,
        type: s.step_type,
        params: s.step_params,
      })),
      start_index: 0,
      preview_rows: 100,
    };

    const result = await mlService.preprocessDataset(mlPayload, userId);

    return res.status(200).json({
      message: removed
        ? `Step undone: ${removed.step_type}`
        : "No steps to undo. Showing raw dataset.",
      ...result,
      total_steps: allSteps.length,
      dataset_id: datasetId,
    });
  } catch (error) {
    return res.status(500).json({ message: "Undo failed", error: error.message });
  }
};

// =========================================
// 4. FINALIZE  –  POST /api/datasets/:datasetId/finalize
// =========================================
exports.finalizeDataset = async (req, res) => {
  try {
    const userId = req.user.id;
    const datasetId = parseInt(req.params.datasetId);

    const dataset = await datasetService.getDatasetById(datasetId);
    if (!dataset || dataset.user_id !== userId) {
      return res.status(404).json({ message: "Dataset not found." });
    }

    const pipeline = await datasetService.getActivePipelineForDataset(datasetId);
    if (!pipeline) {
      return res.status(400).json({ message: "No active pipeline found." });
    }

    const allSteps = await datasetService.getPipelineSteps(pipeline.id);

    // Tell ML service to apply steps and replace raw
    const result = await mlService.finalizeDataset({
      user_id: userId,
      dataset_id: datasetId,
      steps: allSteps.map(s => ({
        step_index: s.step_index,
        type: s.step_type,
        params: s.step_params,
      })),
    });

    // Update DB statuses
    await datasetService.updateDatasetStatus(datasetId, 'completed');
    await datasetService.updatePipelineStatus(pipeline.id, 'completed');

    return res.status(200).json({
      message: "Dataset finalized successfully.",
      ...result,
      dataset_id: datasetId,
    });
  } catch (error) {
    return res.status(500).json({ message: "Finalize failed", error: error.message });
  }
};

// =========================================
// 5. DOWNLOAD  –  GET /api/datasets/:datasetId/download
// =========================================
exports.downloadDataset = async (req, res) => {
  try {
    const userId = req.user.id;
    const datasetId = parseInt(req.params.datasetId);

    const dataset = await datasetService.getDatasetById(datasetId);
    if (!dataset || dataset.user_id !== userId) {
      return res.status(404).json({ message: "Dataset not found." });
    }

    // Fetch current pipeline steps so download reflects latest state
    let steps = [];
    const pipeline = await datasetService.getActivePipelineForDataset(datasetId);
    if (pipeline) {
      const dbSteps = await datasetService.getPipelineSteps(pipeline.id);
      steps = dbSteps.map(s => ({
        step_index: s.step_index,
        type: s.step_type,
        params: s.step_params,
      }));
    }

    const csvStream = await mlService.downloadDataset(userId, datasetId, steps);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${dataset.original_filename}"`
    );

    csvStream.on('error', (err) => {
      if (!res.headersSent) {
        res.status(500).json({ message: "Download failed", error: err.message });
      } else {
        res.end();
      }
    });

    csvStream.pipe(res);
  } catch (error) {

    // If the ML service returned an error response, try to extract the detail
    if (error.response) {
      let errorMsg = "Download failed";
      try {
        // For stream responses, the error data may be a stream or buffer
        if (error.response.data && typeof error.response.data.on === 'function') {
          // It's a stream — collect it
          const chunks = [];
          for await (const chunk of error.response.data) {
            chunks.push(chunk);
          }
          const body = Buffer.concat(chunks).toString('utf-8');
          const parsed = JSON.parse(body);
          errorMsg = parsed.detail || parsed.message || errorMsg;
        } else if (error.response.data) {
          errorMsg = error.response.data.detail || error.response.data.message || errorMsg;
        }
      } catch (_) { /* ignore parse errors */ }
      return res.status(error.response.status || 500).json({ message: errorMsg });
    }

    return res.status(500).json({ message: "Download failed", error: error.message });
  }
};

// =========================================
// 6. LIST DATASETS  –  GET /api/datasets/list
// =========================================
exports.getUserDatasets = async (req, res) => {
  try {
    const userId = req.user.id;
    const datasets = await datasetService.getUserDatasets(userId);
    return res.status(200).json({ datasets });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to get datasets",
      error: error.message,
    });
  }
};

// =========================================
// 7. RESUME  –  POST /api/datasets/:datasetId/resume
//    Re-upload file → rebuild from stored steps
// =========================================
exports.resumeDataset = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const userId = req.user.id;
    const datasetId = parseInt(req.params.datasetId);

    const dataset = await datasetService.getDatasetById(datasetId);
    if (!dataset || dataset.user_id !== userId) {
      return res.status(404).json({ message: "Dataset not found." });
    }

    // Upload raw to ML service for this dataset
    await mlService.uploadDataset(req.file, userId, datasetId);

    // Refresh cache with the newly uploaded raw file
    await datasetCache.set(userId, datasetId, req.file);

    // Get pipeline and steps
    const pipeline = await datasetService.getActivePipelineForDataset(datasetId);
    if (!pipeline) {
      return res.status(400).json({ message: "No pipeline found for this dataset." });
    }

    const allSteps = await datasetService.getPipelineSteps(pipeline.id);

    // Rebuild with all stored steps
    const mlPayload = {
      user_id: userId,
      dataset_id: datasetId,
      steps: allSteps.map(s => ({
        step_index: s.step_index,
        type: s.step_type,
        params: s.step_params,
      })),
      start_index: 0,
      preview_rows: 100,
    };

    const result = await mlService.preprocessDataset(mlPayload, userId);

    // Make this the active dataset
    await datasetService.setActiveDataset(userId, datasetId);

    return res.status(200).json({
      message: `Dataset resumed with ${allSteps.length} step(s) replayed.`,
      ...result,
      dataset_id: datasetId,
      pipeline_id: pipeline.id,
      total_steps: allSteps.length,
    });
  } catch (error) {
        // Provide specific error messages for common failure points
        let errorMessage = "Resume failed";
        let statusCode = 500;

        // Check if it's an ML Service error with details
        if (error.response?.data?.detail) {
          errorMessage = error.response.data.detail;
          statusCode = error.response.status || 400;
        }
        // Check if it's our custom error from mlService
        else if (error.message?.includes('ML Service not reachable')) {
          errorMessage = error.message;
          statusCode = 503;
        }
        // For other errors, provide at least a meaningful message
        else if (error.message) {
          errorMessage = error.message;
        }

        return res.status(statusCode).json({
          message: errorMessage,
          error: errorMessage,
          details: `Failed to resume dataset. Step failed at: ${error.message || 'unknown'}`,
        });
  }
};

// =========================================
// 8. GET PIPELINE STEPS – GET /api/datasets/:datasetId/steps
// =========================================
exports.getPipelineSteps = async (req, res) => {
  try {
    const userId = req.user.id;
    const datasetId = parseInt(req.params.datasetId);

    const dataset = await datasetService.getDatasetById(datasetId);
    if (!dataset || dataset.user_id !== userId) {
      return res.status(404).json({ message: "Dataset not found." });
    }

    const pipeline = await datasetService.getActivePipelineForDataset(datasetId);
    if (!pipeline) {
      return res.status(200).json({ steps: [] });
    }

    const steps = await datasetService.getPipelineSteps(pipeline.id);

    // Format steps with human-readable info
    const formattedSteps = steps.map(s => {
      const params = s.step_params || [];
      const columns = params.map(p => p.column || (p.columns ? p.columns.join(', ') : 'all')).filter(Boolean);
      const strategy = params[0]?.strategy || 'auto';

      return {
        step_index: s.step_index,
        type: s.step_type,
        strategy,
        columns,
        created_at: s.created_at,
      };
    });

    return res.status(200).json({ steps: formattedSteps });
  } catch (error) {
    return res.status(500).json({ message: "Failed to get steps", error: error.message });
  }
};

// =========================================
// 9. ACTIVATE  –  POST /api/datasets/:datasetId/activate
// =========================================
exports.activateDataset = async (req, res) => {
  try {
    const userId = req.user.id;
    const datasetId = parseInt(req.params.datasetId);

    await datasetService.setActiveDataset(userId, datasetId);

    return res.status(200).json({ message: "Dataset activated", dataset_id: datasetId });
  } catch (error) {
    return res.status(500).json({
      message: "Activation failed",
      error: error.message,
    });
  }
};
