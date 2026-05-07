const { AppError } = require('./errorHandler.middleware');

// Role hierarchy
const ROLE_HIERARCHY = {
  ADMIN: 5,
  SUPERVISOR: 4,
  MECHANIC: 3,
  RECEPTIONIST: 2,
  VIEWER: 1,
};

// Permissions map per role
const ROLE_PERMISSIONS = {
  ADMIN: ['*'],
  SUPERVISOR: [
    'users:read', 'clients:*', 'motorcycles:*', 'services:*',
    'checklists:*', 'inventory:*', 'suppliers:*', 'reports:*', 'audit:read',
    'notifications:*', 'dashboard:read',
  ],
  MECHANIC: [
    'clients:read', 'motorcycles:read', 'services:read', 'services:update',
    'checklists:*', 'inventory:read', 'dashboard:read', 'notifications:read',
  ],
  RECEPTIONIST: [
    'clients:*', 'motorcycles:*', 'services:create', 'services:read', 'services:update',
    'checklists:read', 'inventory:read', 'dashboard:read', 'notifications:read',
  ],
  VIEWER: ['clients:read', 'motorcycles:read', 'services:read', 'dashboard:read'],
};

const hasPermission = (userRole, permission) => {
  const perms = ROLE_PERMISSIONS[userRole] || [];
  if (perms.includes('*')) return true;
  if (perms.includes(permission)) return true;

  const [resource, action] = permission.split(':');
  if (perms.includes(`${resource}:*`)) return true;

  return false;
};

// Middleware: require specific roles
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return next(new AppError('No autenticado.', 401));
  if (!roles.includes(req.user.role)) {
    return next(new AppError('No tienes permisos para esta acción.', 403));
  }
  next();
};

// Middleware: require minimum role level
const requireMinRole = (minRole) => (req, res, next) => {
  if (!req.user) return next(new AppError('No autenticado.', 401));
  const userLevel = ROLE_HIERARCHY[req.user.role] || 0;
  const minLevel = ROLE_HIERARCHY[minRole] || 0;
  if (userLevel < minLevel) return next(new AppError('No tienes permisos suficientes.', 403));
  next();
};

// Middleware: require permission
const requirePermission = (permission) => (req, res, next) => {
  if (!req.user) return next(new AppError('No autenticado.', 401));
  if (!hasPermission(req.user.role, permission)) {
    return next(new AppError(`Permiso requerido: ${permission}`, 403));
  }
  next();
};

module.exports = { requireRole, requireMinRole, requirePermission, hasPermission, ROLE_PERMISSIONS };
