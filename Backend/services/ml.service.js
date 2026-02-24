const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

const ML_SERVICE_URL = process.env.ML_SERVICE_URL;

// =========================================
// 1. UPLOAD — forwards file + user_id + dataset_id
// =========================================
exports.uploadDataset = async (file, userId, datasetId = 0) => {
  if (!ML_SERVICE_URL) {
    throw new Error("ML_SERVICE_URL not configured in environment variables");
  }

  const FormData = require("form-data");
  const formData = new FormData();
  formData.append("file", file.buffer, file.originalname);
  formData.append("user_id", String(userId));
  formData.append("dataset_id", String(datasetId));

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

// =========================================
// 2. PREPROCESS — rebuild-based, sends ALL steps
// =========================================
exports.preprocessDataset = async (payload, userId) => {
  try {
    // Add user_id to payload
    payload.user_id = userId;

    // Defensive normalization: ensure steps are properly formatted
    if (payload.steps && Array.isArray(payload.steps)) {
      payload.steps = payload.steps.map((step, index) => {
        if (typeof step === 'string') {
          try {
            step = JSON.parse(step);
          } catch (e) {
            throw new Error(`Step ${index}: Invalid JSON string`);
          }
        }
        if (!step || typeof step !== 'object') {
          throw new Error(`Step ${index}: Must be an object`);
        }
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
      { headers: { "Content-Type": "application/json" } }
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
    console.error("❌ ML Service Error:", error.message);
    throw error;
  }
};

// =========================================
// 3. FINALIZE — apply steps and replace raw
// =========================================
exports.finalizeDataset = async (payload) => {
  try {
    const response = await axios.post(
      `${ML_SERVICE_URL}/api/data/finalize`,
      payload,
      { headers: { "Content-Type": "application/json" } }
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
    console.error("❌ ML Finalize Error:", error.message);
    throw error;
  }
};

// =========================================
// 4. DOWNLOAD — get dataset as CSV stream
//    If steps are provided, rebuilds from raw first.
//    Otherwise returns raw/finalized dataset.
// =========================================
exports.downloadDataset = async (userId, datasetId, steps = []) => {
  try {
    let response;

    if (steps && steps.length > 0) {
      // POST with steps → ML rebuilds from raw, returns processed CSV
      response = await axios.post(
        `${ML_SERVICE_URL}/api/data/download`,
        {
          user_id: userId,
          dataset_id: datasetId,
          steps,
        },
        {
          headers: { 'Content-Type': 'application/json' },
          responseType: 'stream',
        }
      );
    } else {
      // GET without steps → returns raw/finalized CSV
      response = await axios.get(
        `${ML_SERVICE_URL}/api/data/download`,
        {
          params: { user_id: userId, dataset_id: datasetId },
          responseType: 'stream',
        }
      );
    }

    return response.data;
  } catch (error) {
    console.error("❌ ML Download Error:", error.message);
    throw error;
  }
};