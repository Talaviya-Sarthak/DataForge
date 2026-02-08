const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  console.log("🔐 Auth middleware triggered for:", req.method, req.originalUrl);
  console.log("Headers:", req.headers);

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.log("❌ No authorization header");
    return res.status(401).json({ error: "Authorization header missing" });
  }

  const token = authHeader.split(" ")[1];
  console.log("Token:", token ? "Present" : "Missing");

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ Token decoded:", decoded);
    req.user = { id: decoded.id };
    next();
  } catch (err) {
    console.log("❌ Token verification failed:", err.message);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

module.exports = authMiddleware;
