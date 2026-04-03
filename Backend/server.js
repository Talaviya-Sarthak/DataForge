
require("dotenv").config();

const http = require("http");
const express = require("express");
const cors = require("cors");
const datasetService = require("./services/dataset.service");
const { apiLimiter, authLimiter, uploadLimiter, sanitizeInput } = require("./middlewares/rateLimiter.middleware");
const { initWebSocket } = require('./websocket/ws.server');
const logger = require('./utils/logger');

// Initialize queue events monitoring
const { trainingQueueEvents } = require('./queues/training.events');

const app = express();
const PORT = process.env.PORT || 5000;

// =======================
// SYSTEM INITIALIZATION
// =======================
(async () => {
  try {
    await datasetService.initializeSystem();
    logger.info('[SERVER]', 'Pipeline system initialized');
  } catch (error) {
    logger.error('[SERVER]', 'Pipeline system initialization failed', { error: error.message });
  }
})();

// =======================
// GLOBAL MIDDLEWARE
// =======================
app.use(cors({
  origin: true,
  credentials: true
}));

// 🔑 MUST come before routes
app.use(express.json());

// =======================
// PUBLIC AUTH ROUTES
// =======================
app.use("/api/auth", require("./routes/signupEntry"));   // POST /signup
app.use("/api/auth", require("./routes/signinEntry"));   // POST /signin

// =======================
// PROTECTED USER ROUTES
// =======================
app.use("/api/user", require("./routes/onboardingEntry"));
app.use("/api/user", require("./routes/toolsEntry"));
app.use("/api/user", require("./routes/projectTypesEntry"));
app.use("/api/user", require("./routes/preferencesEntry"));

// =======================
// DATASET ROUTES (OPTIONAL)
// =======================
app.use("/api/datasets", require("./routes/dataset.routes"));

// =======================
// TRAINING ROUTES
// =======================
// Note: Rate limiting is applied per-route in training.routes.js
app.use("/api/training", require("./routes/training.routes"));



// =======================
// HEALTH CHECK
// =======================
app.use("/api/health", require("./routes/health.routes"));

app.get("/", (req, res) => {
  res.status(200).send("🚀 Backend Running");
});

// =======================
// 404 HANDLER
// =======================
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found"
  });
});

// =======================
// GLOBAL ERROR HANDLER
// =======================
app.use((err, req, res, next) => {
  logger.error('[SERVER]', 'Unhandled error', { error: err.message, path: req.originalUrl });
  res.status(500).json({
    error: "Internal server error"
  });
});

// =======================
// START SERVER
// =======================
const httpServer = http.createServer(app);
const io = initWebSocket(httpServer);

httpServer.listen(PORT, "0.0.0.0", () => {
  logger.info('[SERVER]', `Running on port ${PORT}`);
});
