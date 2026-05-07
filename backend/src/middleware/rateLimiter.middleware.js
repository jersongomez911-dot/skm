const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger.utils');

const createLimiter = (options) => rateLimit({
  windowMs: options.windowMs || 15 * 60 * 1000,
  max: options.max || 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded: ${req.ip} on ${req.path}`);
    res.status(429).json({
      success: false,
      message: 'Demasiadas solicitudes, intenta más tarde.',
      retryAfter: Math.ceil(options.windowMs / 1000 / 60) + ' minutos',
    });
  },
  ...options,
});

const generalLimiter = createLimiter({ windowMs: 15 * 60 * 1000, max: 200 });
const authLimiter = createLimiter({ windowMs: 15 * 60 * 1000, max: 10, message: 'Demasiados intentos de login' });
const uploadLimiter = createLimiter({ windowMs: 60 * 1000, max: 20 });

module.exports = { generalLimiter, authLimiter, uploadLimiter };
