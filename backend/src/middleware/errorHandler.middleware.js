const logger = require('../utils/logger.utils');

const notFoundHandler = (req, res) => {
  res.status(404).json({ success: false, message: `Ruta no encontrada: ${req.method} ${req.path}` });
};

const errorHandler = (err, req, res, next) => {
  logger.error(`${err.name}: ${err.message}`, { stack: err.stack, path: req.path, method: req.method });

  // Prisma errors
  if (err.code === 'P2002') {
    const field = err.meta?.target?.join(', ') || 'campo';
    return res.status(409).json({ success: false, message: `Ya existe un registro con ese ${field}.` });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ success: false, message: 'Registro no encontrado.' });
  }
  if (err.code === 'P2003') {
    return res.status(400).json({ success: false, message: 'Referencia a registro inexistente.' });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') return res.status(401).json({ success: false, message: 'Token inválido.' });
  if (err.name === 'TokenExpiredError') return res.status(401).json({ success: false, message: 'Token expirado.' });

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ success: false, message: 'Archivo muy grande. Máximo 10MB.' });
  if (err.code === 'LIMIT_UNEXPECTED_FILE') return res.status(400).json({ success: false, message: 'Campo de archivo inesperado.' });

  // Operational errors (custom)
  if (err.isOperational) {
    return res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }

  // Unknown
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Error interno del servidor.' : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = { errorHandler, notFoundHandler, AppError };
