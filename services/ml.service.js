const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

const ML_SERVICE_URL = process.env.ML_SERVICE_URL;

exports.uploadDataset = async (file) => {
  const FormData = require("form-data");
  const formData = new FormData();
  formData.append(
    "file",
    file.buffer,
    file.originalname
  );

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
};


exports.preprocessDataset = async (payload) => {
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
};
