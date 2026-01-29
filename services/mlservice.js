const axios = require("axios");
const FormData = require("form-data");

const ML_BASE_URL = process.env.ML_BASE_URL;

exports.uploadDataset = async (file) => {
  const formData = new FormData();
  formData.append("file", file.buffer, file.originalname);

  const response = await axios.post(`${ML_BASE_URL}/data/upload`, formData, {
    headers: formData.getHeaders(),
  });

  return response.data;
};

exports.preprocessDataset = async (payload) => {
  const response = await axios.post(`${ML_BASE_URL}/data/preprocess`, payload);
  return response.data;
};
