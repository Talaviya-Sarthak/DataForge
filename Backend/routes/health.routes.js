const express = require('express');
const router = express.Router();
const { healthCheck } = require('../controllers/health.controller');

// GET /api/health - Health check endpoint (no auth required)
router.get('/', healthCheck);

module.exports = router;
