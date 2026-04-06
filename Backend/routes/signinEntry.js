const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

const {
  findUserByEmail,
  comparePassword
} = require("../Database/models/user/signinModel");

// Token expiration times from environment variables
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || "30m";
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || "7d";

const getExpiresInSeconds = (token) => {
  const decoded = jwt.decode(token);
  if (!decoded?.exp) return 0;
  return Math.max(0, decoded.exp - Math.floor(Date.now() / 1000));
};

// =======================
// ✅ SIGNIN ROUTE
// =======================
router.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1️⃣ Validation
    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required"
      });
    }

    // 2️⃣ Find user
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        error: "Invalid credentials"
      });
    }

    // 3️⃣ Compare password
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        error: "Invalid credentials"
      });
    }

    // 4️⃣ Generate Access Token (short-lived)
    const accessToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        type: "access"
      },
      process.env.JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    // 5️⃣ Generate Refresh Token (long-lived)
    const refreshToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        type: "refresh"
      },
      process.env.JWT_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRY }
    );

    const accessTokenExpiresIn = getExpiresInSeconds(accessToken);

    // 6️⃣ Success - return both tokens
    return res.status(200).json({
      message: "Signin successful",
      token: accessToken,           // Backward compatible
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: accessTokenExpiresIn,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });

  } catch (err) {
    return res.status(500).json({
      error: "Internal server error"
    });
  }
});

// =======================
// ✅ REFRESH TOKEN ROUTE
// =======================
router.post("/refresh", async (req, res) => {
  try {
    const { refresh_token } = req.body;

    // Also check Authorization header for refresh token
    const authHeader = req.headers.authorization;
    const tokenFromHeader = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : null;

    const token = refresh_token || tokenFromHeader;

    if (!token) {
      return res.status(400).json({
        error: "Refresh token is required"
      });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          error: "Refresh token expired",
          code: "REFRESH_TOKEN_EXPIRED"
        });
      }
      return res.status(401).json({
        error: "Invalid refresh token"
      });
    }

    // Verify it's a refresh token
    if (decoded.type !== "refresh") {
      return res.status(401).json({
        error: "Invalid token type"
      });
    }

    // Find user to ensure they still exist
    const user = await findUserByEmail(decoded.email);
    if (!user) {
      return res.status(401).json({
        error: "User not found"
      });
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        type: "access"
      },
      process.env.JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    // Optionally rotate refresh token (more secure)
    const newRefreshToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        type: "refresh"
      },
      process.env.JWT_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRY }
    );

    const accessTokenExpiresIn = getExpiresInSeconds(newAccessToken);

    return res.status(200).json({
      message: "Token refreshed successfully",
      token: newAccessToken,           // Backward compatible
      access_token: newAccessToken,
      refresh_token: newRefreshToken,  // Rotated refresh token
      expires_in: accessTokenExpiresIn
    });

  } catch (err) {
    return res.status(500).json({
      error: "Internal server error"
    });
  }
});

module.exports = router;
