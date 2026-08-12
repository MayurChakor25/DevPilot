const env = require('../config/env');

/**
 * 404 handler for unmatched routes. Placed after all routes in app.js.
 */
function notFound(req, res, next) {
  const err = new Error(`Route not found - ${req.originalUrl}`);
  err.statusCode = 404;
  next(err);
}

/**
 * Centralized error handler. Always returns the structured JSON shape:
 * { success: false, message: "..." }
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid value for ${err.path}`;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `${field} already exists`;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token expired';
  }

  // Multer errors
  if (err.name === 'MulterError') {
    statusCode = 400;
    message = err.message;
  }

  if (statusCode === 500) {
    // eslint-disable-next-line no-console
    console.error('[ERROR]', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(env.NODE_ENV === 'development' && statusCode === 500 ? { stack: err.stack } : {}),
  });
}

module.exports = { notFound, errorHandler };
