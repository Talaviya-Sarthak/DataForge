const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

exports.uploadDataset = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Dataset upload failed",
      });
    }

    // Forward file to ML service
    const mlServiceUrl = process.env.ML_SERVICE_URL || "http://localhost:8000";
    const filePath = req.file.path;
    
    // Create form data to forward to ML service
    const formData = new FormData();
    formData.append("file", fs.createReadStream(filePath), {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    try {
      // Forward request to ML service
      const mlResponse = await axios.post(
        `${mlServiceUrl}/api/data/upload`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
        }
      );

      // Return ML service response to frontend
      return res.status(200).json({
        message: "Dataset loaded successfully",
        filename: req.file.filename,
        ...mlResponse.data,
      });
    } catch (mlError) {
      console.error("ML Service Error:", mlError.message);
      return res.status(500).json({
        message: "Dataset processing failed",
        error: mlError.response?.data?.detail || mlError.message,
      });
    }
  } catch (error) {
    console.error("Upload Error:", error);
    return res.status(500).json({
      message: "Dataset upload failed",
      error: error.message,
    });
  }
};
