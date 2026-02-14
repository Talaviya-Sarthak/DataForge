require("dotenv").config();
const express = require("express");
const app = express();

// Middleware
app.use(express.json());

// Mount routes
app.use("/api/datasets", require("./routes/dataset.routes"));

// Simple route check
const datasetRoutes = require("./routes/dataset.routes");
console.log("\nDataset routes module loaded successfully");
console.log("Route stack:");
datasetRoutes.stack.forEach((layer) => {
  if (layer.route) {
    console.log(`  ${Object.keys(layer.route.methods).join(',').toUpperCase()} /api/datasets${layer.route.path}`);
  }
});
