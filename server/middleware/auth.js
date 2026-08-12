const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const env = require('../config/env');
const AppError = require('../utils/AppError');
const User = require('../models/User');

/**
 * Protects routes by requiring a valid JWT in the Authorization header
 * ("Bearer <token>"). Attaches the authenticated user to req.user.
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    throw new AppError('Not authorized, no token provided', 401);
  }

  let decoded;
  try {
    decoded = jwt.verify(token, env.JWT_SECRET);
  } catch (err) {
    throw new AppError('Not authorized, token invalid or expired', 401);
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    throw new AppError('Not authorized, user no longer exists', 401);
  }

  req.user = user;
  next();
});

module.exports = { protect };
