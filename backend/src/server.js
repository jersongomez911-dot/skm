require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/database');
const logger = require('./utils/logger.utils');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5000;

// Ensure upload dirs exist
const uploadDirs = ['uploads', 'uploads/photos', 'uploads/signatures', 'uploads/avatars'];
uploadDirs.forEach(dir => {
  const fullPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(fullPath)) fs.mkdirSync(fullPath, { recursive: true });
});

async function start() {
  try {
    await connectDB();
    app.listen(PORT, '0.0.0.0', () => {
      logger.info(` SKM Backend running on port ${PORT}`);
      logger.info(` Environment: ${process.env.NODE_ENV}`);
      logger.info(` URL: http://localhost:${PORT}`);
    });
  } catch (err) {
    logger.error(' Failed to start server:', err);
    process.exit(1);
  }
}

start();

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});
