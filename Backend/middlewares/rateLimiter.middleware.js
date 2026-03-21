const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = require("express-rate-limit");

// ── General API rate limiter ───────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                 // 100 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    message: "Too many requests. Please try again later.",
  },
});

// ── Stricter limiter for auth endpoints ────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,                  // 20 attempts per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    message: "Too many authentication attempts. Please try again later.",
  },
});

// ── Relaxed limiter for training (async operations) ──
const trainingLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,  // 1 minute
  max: 5,                   // 5 training requests per minute per user
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    if (req.user && req.user.id) {
      return `user_${req.user.id}`;
    }
    return ipKeyGenerator(req);
  },
  message: {
    status: "error",
    message: "Training rate limit exceeded. Please wait before starting another training session.",
  },
});

// ── High-limit for polling endpoints (status checks) ──
const pollingLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,  // 1 minute
  max: 100,                 // 100 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    if (req.user && req.user.id) {
      return `user_${req.user.id}`;
    }
    return ipKeyGenerator(req);
  },
  message: {
    status: "error",
    message: "Too many status check requests. Please slow down polling.",
  },
});

// ── Upload limiter ─────────────────────────────────
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,                  // 30 uploads per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    message: "Upload rate limit exceeded. Please try again later.",
  },
});

// ── Polling limiter (for status checks) ────────────────────────────────
const pollingLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,  // 1 minute
  max: 60,                  // 60 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    message: "Polling rate limit exceeded. Please slow down.",
  },
});

/**
 * Sanitize string inputs to prevent XSS / injection.
 * Strips HTML tags and trims whitespace.
 */
const sanitizeInput = (req, res, next) => {
  if (req.body && typeof req.body === "object") {
    sanitizeObject(req.body);
  }
  if (req.query && typeof req.query === "object") {
    sanitizeObject(req.query);
  }
  if (req.params && typeof req.params === "object") {
    sanitizeObject(req.params);
  }
  next();
};

function sanitizeObject(obj) {
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === "string") {
      // Strip HTML tags
      obj[key] = obj[key].replace(/<[^>]*>/g, "");
      // Trim whitespace
      obj[key] = obj[key].trim();
    } else if (typeof obj[key] === "object" && obj[key] !== null && !Buffer.isBuffer(obj[key])) {
      // Skip arrays of non-objects (like steps arrays)
      if (Array.isArray(obj[key])) {
        obj[key].forEach((item, i) => {
          if (typeof item === "string") {
            obj[key][i] = item.replace(/<[^>]*>/g, "").trim();
          } else if (typeof item === "object" && item !== null) {
            sanitizeObject(item);
          }
        });
      } else {
        sanitizeObject(obj[key]);
      }
    }
  }
}

// ── No rate limit (for specific endpoints) ──
const noRateLimit = (req, res, next) => next();

module.exports = {
  apiLimiter,
  authLimiter,
  trainingLimiter,
  pollingLimiter,
  uploadLimiter,
  pollingLimiter,
  sanitizeInput,
  noRateLimit,
};
