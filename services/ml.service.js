const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

const ML_SERVICE_URL = process.env.ML_SERVICE_URL;

exports.uploadDataset = async (file) => {
  if (!file.path || !fs.existsSync(file.path)) {
    throw new Error(`Uploaded file not found at path: ${file.path}`);
  }

  const formData = new FormData();
  formData.append(
    "file",
    fs.createReadStream(file.path),
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
