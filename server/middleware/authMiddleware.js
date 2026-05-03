// ✅ COMPLETE FIX FOR AUTH MIDDLEWARE TOKEN ISSUE
// Problem:
// authHeader may be missing / malformed
// JWT_SECRET may be undefined
// token may include spaces/newline
// old token may be invalid
require('dotenv').config();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ==============================
// AUTH MIDDLEWARE
// ==============================
module.exports = async (req, res, next) => {
  try {
    // ==============================
    // CHECK JWT SECRET
    // ==============================
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET Missing');

      return res.status(500).json({
        message: 'Server configuration error: JWT_SECRET missing'
      });
    }

    // ==============================
    // GET AUTH HEADER
    // ==============================
    const authHeader = req.headers.authorization;

    // console.log('AUTH HEADER:', authHeader);

    // Example:
    // Bearer eyJhbGciOiJIUzI1Ni...

    if (!authHeader) {
      return res.status(401).json({
        message: 'Authorization header missing'
      });
    }

    // ==============================
    // VALIDATE FORMAT
    // ==============================
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Invalid authorization format'
      });
    }

    // ==============================
    // EXTRACT TOKEN SAFELY
    // ==============================
    const token = authHeader.replace('Bearer ', '').trim();

    if (!token) {
      return res.status(401).json({
        message: 'Token missing'
      });
    }

    if (req.method === "OPTIONS") {
      return next();
    }

    // console.log('TOKEN:', token);

    // ==============================
    // VERIFY TOKEN
    // ==============================
    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      console.error('JWT VERIFY ERROR:', jwtError.message);

      return res.status(401).json({
        message:
          jwtError.name === 'TokenExpiredError'
            ? 'Token expired'
            : 'Invalid token'
      });
    }

    // console.log('DECODED:', decoded);

    // ==============================
    // FIND USER
    // ==============================
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        message: 'User not found'
      });
    }

    // ==============================
    // ATTACH USER
    // ==============================
    req.user = user;

    next();
  } catch (error) {
    console.error('AUTH ERROR:', error);

    return res.status(500).json({
      message: 'Server authentication error'
    });
  }
};

