/**
 * Custom operational error class. Any error thrown with this class is
 * considered "trusted" (safe to expose its message to the client) by the
 * centralized error middleware.
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
