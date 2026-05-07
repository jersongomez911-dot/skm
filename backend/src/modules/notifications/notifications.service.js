const { prisma } = require('../../config/database');

const getAll = async (userId, { isRead, page = 1, limit = 20 }) => {
  const where = { userId };
  if (isRead !== undefined) where.isRead = isRead === 'true';
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [data, total] = await Promise.all([
    prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: parseInt(limit) }),
    prisma.notification.count({ where }),
  ]);
  return { data, total };
};

const getUnreadCount = async (userId) => prisma.notification.count({ where: { userId, isRead: false } });

const markRead = async (id, userId) => prisma.notification.update({ where: { id, userId }, data: { isRead: true } });

const markAllRead = async (userId) => prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });

const remove = async (id, userId) => prisma.notification.delete({ where: { id, userId } });

const create = async (userId, { type, title, message, metadata }) =>
  prisma.notification.create({ data: { userId, type, title, message, metadata } });

module.exports = { getAll, getUnreadCount, markRead, markAllRead, remove, create };
