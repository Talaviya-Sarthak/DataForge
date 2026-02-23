const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

const ML_SERVICE_URL = process.env.ML_SERVICE_URL;

// ─────────────────────────────────────────────
// UPLOAD DATASET (with optional dataset_id)
// ─────────────────────────────────────────────
exports.uploadDataset = async (file, userId, datasetId) => {
  if (!ML_SERVICE_URL) {
    throw new Error("ML_SERVICE_URL not configured in environment variables");
  }

  const FormData = require("form-data");
  const formData = new FormData();
  formData.append(
    "file",
    file.buffer,
    file.originalname
  );
  formData.append("user_id", String(userId));
  if (datasetId !== undefined && datasetId !== null) {
    formData.append("dataset_id", String(datasetId));
  }

  try {
    const response = await axios.post(
      `${ML_SERVICE_URL}/api/data/upload`,
      formData,
      { headers: formData.getHeaders() }
    );

    const data = response.data;

    data.numerical_columns = Array.isArray(data.numerical_columns)
      ? data.numerical_columns
      : [];

    data.categorical_columns = Array.isArray(data.categorical_columns)
      ? data.categorical_columns
      : [];

    return data;
  } catch (error) {
    console.error("ML Service Error:", error.message);
    if (error.code === 'ECONNREFUSED') {
      throw new Error(`ML Service not reachable at ${ML_SERVICE_URL}. Please ensure it's running.`);
    }
    throw new Error(error.response?.data?.detail || error.message);
  }
};


// ─────────────────────────────────────────────
// PREPROCESS DATASET (with optional rebuild)
// ─────────────────────────────────────────────
exports.preprocessDataset = async (payload, userId) => {
  try {
    // Add user_id to payload
    payload.user_id = userId;
    // Defensive normalization: ensure steps are properly formatted
    if (payload.steps && Array.isArray(payload.steps)) {
      payload.steps = payload.steps.map((step, index) => {
        // If step is string, parse to object
        if (typeof step === 'string') {
          try {
            step = JSON.parse(step);
          } catch (e) {
            throw new Error(`Step ${index}: Invalid JSON string`);
          }
        }
        
        // Validate step structure
        if (!step || typeof step !== 'object') {
          throw new Error(`Step ${index}: Must be an object`);
        }
        
        // Ensure params is object
        if (step.params && typeof step.params === 'string') {
          try {
            step.params = JSON.parse(step.params);
          } catch (e) {
            throw new Error(`Step ${index}: Invalid params JSON`);
          }
        }
        
        return step;
      });
    }

    const response = await axios.post(
      `${ML_SERVICE_URL}/api/data/preprocess`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const data = response.data;

    // 🔒 DEFENSIVE NORMALIZATION
    data.numerical_columns = Array.isArray(data.numerical_columns)
      ? data.numerical_columns
      : [];

    data.categorical_columns = Array.isArray(data.categorical_columns)
      ? data.categorical_columns
      : [];

    return data;
  } catch (error) {
    console.error("❌ ML Service Error:", error.message);
    throw error;
  }
};


// ─────────────────────────────────────────────
// FINALIZE DATASET (raw = working in ML memory)
// ─────────────────────────────────────────────
exports.finalizeDataset = async (userId, datasetId) => {
  try {
    const response = await axios.post(
      `${ML_SERVICE_URL}/api/data/finalize`,
      { user_id: userId, dataset_id: datasetId },
      { headers: { "Content-Type": "application/json" } }
    );
    return response.data;
  } catch (error) {
    console.error("❌ ML Finalize Error:", error.message);
    throw new Error(error.response?.data?.detail || error.message);
  }
};


// ─────────────────────────────────────────────
// DOWNLOAD DATASET (CSV stream)
// ─────────────────────────────────────────────
exports.downloadDataset = async (userId, datasetId, finalized) => {
  try {
    const response = await axios.post(
      `${ML_SERVICE_URL}/api/data/download`,
      { user_id: userId, dataset_id: datasetId, finalized },
      {
        headers: { "Content-Type": "application/json" },
        responseType: 'stream',
      }
    );
    return response;
  } catch (error) {
    console.error("❌ ML Download Error:", error.message);
    throw new Error(error.response?.data?.detail || error.message);
  }
};


// ─────────────────────────────────────────────
// VALIDATE SCHEMA (for resume flow)
// ─────────────────────────────────────────────
exports.validateSchema = async (userId, datasetId, requiredColumns) => {
  try {
    const response = await axios.post(
      `${ML_SERVICE_URL}/api/data/validate-schema`,
      { user_id: userId, dataset_id: datasetId, required_columns: requiredColumns },
      { headers: { "Content-Type": "application/json" } }
    );
    return response.data;
  } catch (error) {
    console.error("❌ ML Schema Validate Error:", error.message);
    throw new Error(error.response?.data?.detail || error.message);
  }
};


// ─────────────────────────────────────────────
// CLEAR DATASET from ML memory
// ─────────────────────────────────────────────
exports.clearDataset = async (userId, datasetId) => {
  try {
    const response = await axios.post(
      `${ML_SERVICE_URL}/api/data/clear`,
      { user_id: userId, dataset_id: datasetId },
      { headers: { "Content-Type": "application/json" } }
    );
    return response.data;
  } catch (error) {
    console.error("⚠️ ML Clear Error:", error.message);
    // Non-critical — don't throw; stale data is overwritten on next upload
  }
};
