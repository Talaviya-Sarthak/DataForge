const mlService = require("../services/ml.service");

exports.uploadDataset = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded",
      });
    }

    // Send file to ML service
    const mlResponse = await mlService.uploadDataset(req.file);

    return res.status(200).json({
      message: "Dataset uploaded & forwarded to ML service",
      filename: req.file.filename,
      ...mlResponse,
    });
  } catch (error) {
    console.error("Upload Error:", error.message);
    return res.status(500).json({
      message: "Dataset upload failed",
      error: error.message,
    });
  }
};


exports.preprocessDataset = async (req, res) => {
  try {
    const result = await mlService.preprocessDataset(req.body);

    return res.status(200).json({
      message: "Dataset preprocessed successfully",
      ...result,
    });

  } catch (error) {
    console.error("Preprocess Error:", error.message);
    return res.status(500).json({
      message: "Preprocess failed",
      error: error.message,
    });
  }
};
