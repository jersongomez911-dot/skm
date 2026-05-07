const { prisma } = require('../../config/database');

const getAll = async ({ entity, action, userId, dateFrom, dateTo, page = 1, limit = 30 }) => {
  const where = {};
  if (entity) where.entity = entity;
  if (action) where.action = { contains: action };
  if (userId) where.userId = userId;
  if (dateFrom || dateTo) { where.createdAt = {}; if (dateFrom) where.createdAt.gte = new Date(dateFrom); if (dateTo) where.createdAt.lte = new Date(dateTo); }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [data, total] = await Promise.all([
    prisma.auditLog.findMany({ where, include: { user: { select: { name: true, email: true } } }, orderBy: { createdAt: 'desc' }, skip, take: parseInt(limit) }),
    prisma.auditLog.count({ where }),
  ]);
  return { data, total };
};

const getStats = async () => {
  const [byEntity, byAction, byUser] = await Promise.all([
    prisma.auditLog.groupBy({ by: ['entity'], _count: { entity: true }, orderBy: { _count: { entity: 'desc' } }, take: 10 }),
    prisma.auditLog.groupBy({ by: ['action'], _count: { action: true }, orderBy: { _count: { action: 'desc' } }, take: 10 }),
    prisma.auditLog.groupBy({ by: ['userEmail'], _count: { userEmail: true }, orderBy: { _count: { userEmail: 'desc' } }, take: 10 }),
  ]);
  return { byEntity, byAction, byUser };
};

module.exports = { getAll, getStats };
