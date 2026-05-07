const jwt = require('jsonwebtoken');
const { tokenBlacklist } = require('../config/redis');
const { prisma } = require('../config/database');
const { AppError } = require('./errorHandler.middleware');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return next(new AppError('Token de acceso requerido.', 401));
    }

    const token = authHeader.split(' ')[1];

    // Check blacklist
    if (await tokenBlacklist.has(token)) {
      return next(new AppError('Token revocado. Inicia sesión nuevamente.', 401));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return next(new AppError('Usuario no encontrado o inactivo.', 401));
    }

    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    next(err);
  }
};

// Optional auth - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return next();
    const token = authHeader.split(' ')[1];
    if (await tokenBlacklist.has(token)) return next();
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });
    if (user?.isActive) { req.user = user; req.token = token; }
    next();
  } catch {
    next();
  }
};

module.exports = { authenticate, optionalAuth };
