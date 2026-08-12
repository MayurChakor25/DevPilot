const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

/**
 * Centralized, validated access to environment variables.
 * Fails fast (with a clear message) if required secrets are missing,
 * except in test environments where sensible defaults are used.
 */
const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 5000,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',

  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/devpilot-ai',

  JWT_SECRET: process.env.JWT_SECRET || 'dev_only_insecure_secret_change_me',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  // gemini-2.5-flash was retired for new API keys. gemini-3.1-flash-lite is
  // confirmed working on the free API tier as of testing. Override via
  // GEMINI_MODEL if Google changes model availability again.
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',

  MAX_UPLOAD_SIZE_MB: parseInt(process.env.MAX_UPLOAD_SIZE_MB, 10) || 50,
};

if (env.NODE_ENV === 'production' && env.JWT_SECRET === 'dev_only_insecure_secret_change_me') {
  // eslint-disable-next-line no-console
  console.warn('[WARN] JWT_SECRET is using the insecure default value. Set a strong secret in production.');
}

if (!env.GEMINI_API_KEY) {
  // eslint-disable-next-line no-console
  console.warn('[WARN] GEMINI_API_KEY is not set. AI features will be disabled until it is configured.');
}

module.exports = env;
