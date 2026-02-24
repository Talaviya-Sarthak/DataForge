require("dotenv").config();

const express = require("express");
const cors = require("cors");
const datasetService = require("./services/dataset.service");

const app = express();
const PORT = process.env.PORT || 5000;

// =======================
// SYSTEM INITIALIZATION
// =======================
(async () => {
  try {
    await datasetService.initializeSystem();
    console.log("✅ Pipeline system initialized");
  } catch (error) {
    console.error("❌ Pipeline system initialization failed:", error.message);
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
// HEALTH CHECK
// =======================
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
  console.error("❌ Unhandled Error:", err);
  res.status(500).json({
    error: "Internal server error"
  });
});

// =======================
// START SERVER
// =======================
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
