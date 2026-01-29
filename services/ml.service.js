const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

const ML_SERVICE_URL = process.env.ML_SERVICE_URL;

exports.uploadDataset = async (file) => {
  const formData = new FormData();

  formData.append(
    "file",
    fs.createReadStream(file.path),
    file.originalname
  );

  const response = await axios.post(
    `${ML_SERVICE_URL}/api/data/upload`,
    formData,
    {
      headers: formData.getHeaders(),
    }
  );
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

  return response.data;
};


  return response.data;
};
