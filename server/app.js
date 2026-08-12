const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');

const env = require('./config/env');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiters');

const authRoutes = require('./routes/authRoutes');
const repositoryRoutes = require('./routes/repositoryRoutes');
const aiRoutes = require('./routes/aiRoutes');
const conversationRoutes = require('./routes/conversationRoutes');

const app = express();

// --- Security & core middleware ---
app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize());

if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
}

app.use('/api', apiLimiter);

// --- Health check ---
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'DevPilot AI server is running' });
});

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/repositories', repositoryRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/conversations', conversationRoutes);

// --- Error handling (must be last) ---
app.use(notFound);
app.use(errorHandler);

async function start() {
  await connectDB();
  app.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`[DevPilot AI] Server listening on port ${env.PORT} (${env.NODE_ENV})`);
  });
}

if (require.main === module) {
  start().catch((err) => {
    // eslint-disable-next-line no-console
    console.error('[DevPilot AI] Failed to start server:', err);
    process.exit(1);
  });
}

module.exports = app;
