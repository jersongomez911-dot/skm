const { prisma } = require('../config/database');
const logger = require('../utils/logger.utils');

// Creates an audit log entry
const createAuditLog = async ({ userId, userEmail, action, entity, entityId, before, after, req }) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId: userId || null,
        userEmail: userEmail || null,
        action,
        entity,
        entityId: entityId ? String(entityId) : null,
        before: before || undefined,
        after: after || undefined,
        ip: req?.ip || req?.connection?.remoteAddress || null,
        userAgent: req?.headers?.['user-agent'] || null,
      },
    });
  } catch (err) {
    logger.error('Audit log failed:', err);
  }
};

// Middleware factory for automatic route-level auditing
const auditLog = (action, entity) => async (req, res, next) => {
  const originalSend = res.json.bind(res);
  res.json = (body) => {
    if (body?.success !== false) {
      createAuditLog({
        userId: req.user?.id,
        userEmail: req.user?.email,
        action,
        entity,
        entityId: req.params?.id || body?.data?.id,
        req,
      }).catch(() => {});
    }
    return originalSend(body);
  };
  next();
};

module.exports = { createAuditLog, auditLog };
