const mongoose = require('mongoose');
const env = require('./env');

let isConnected = false;

/**
 * Connects to MongoDB using Mongoose. Safe to call multiple times;
 * subsequent calls are no-ops if already connected.
 */
async function connectDB() {
  if (isConnected) return mongoose.connection;

  mongoose.set('strictQuery', true);

  try {
    await mongoose.connect(env.MONGODB_URI);
    isConnected = true;
    // eslint-disable-next-line no-console
    console.log(`[MongoDB] Connected -> ${mongoose.connection.host}/${mongoose.connection.name}`);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[MongoDB] Connection error:', err.message);
    throw err;
  }

  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    // eslint-disable-next-line no-console
    console.warn('[MongoDB] Disconnected');
  });

  return mongoose.connection;
}

module.exports = connectDB;
