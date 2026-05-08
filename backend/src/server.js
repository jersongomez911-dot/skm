require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/database');
const logger = require('./utils/logger.utils');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PORT = process.env.PORT || 8080;

// Ensure upload dirs exist
const uploadDirs = ['uploads', 'uploads/photos', 'uploads/signatures', 'uploads/avatars'];
uploadDirs.forEach(dir => {
  const fullPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(fullPath)) fs.mkdirSync(fullPath, { recursive: true });
});

async function start() {
  try {
    // 1. Run Migrations (Inside the process to manage memory better)
    if (process.env.NODE_ENV === 'production') {
      logger.info('🚀 Running database migrations...');
      try {
        // We use the prisma binary from node_modules
        const prismaPath = path.join(__dirname, '../node_modules/.bin/prisma');
        execSync(`${prismaPath} migrate deploy`, { stdio: 'inherit' });
        logger.info('✅ Migrations completed');
      } catch (migrationError) {
        logger.error('❌ Migration failed, but attempting to start anyway:', migrationError.message);
      }
    }

    // 2. Connect to DB
    await connectDB();

    // 3. Start Listening
    const server = app.listen(PORT, '0.0.0.0', () => {
      logger.info(`🚀 SKM Server LIVE on port ${PORT}`);
      logger.info(`📊 Memory Usage: ${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB RSS`);
    });

    // Graceful shutdown
    const shutdown = (signal) => {
      logger.info(`${signal} received. Closing server...`);
      server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
      });
      setTimeout(() => process.exit(1), 5000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (err) {
    logger.error('💥 Fatal error during startup:', err);
    process.exit(1);
  }
}

start();

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
});
