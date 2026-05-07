const { prisma } = require('../../config/database');
const { hash } = require('../../utils/bcrypt.utils');
const { AppError } = require('../../middleware/errorHandler.middleware');
const { createAuditLog } = require('../../middleware/audit.middleware');

const userSelect = {
  id: true, name: true, email: true, role: true, isActive: true,
  phone: true, avatar: true, twoFactorEnabled: true, lastLogin: true, createdAt: true, updatedAt: true,
};

const getAll = async ({ search, role, isActive, page = 1, limit = 20 }) => {
  const where = {};
  if (search) where.OR = [{ name: { contains: search } }, { email: { contains: search } }];
  if (role) where.role = role;
  if (isActive !== undefined) where.isActive = isActive === 'true';

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [data, total] = await Promise.all([
    prisma.user.findMany({ where, select: userSelect, orderBy: { name: 'asc' }, skip, take: parseInt(limit) }),
    prisma.user.count({ where }),
  ]);
  return { data, total };
};

const getById = async (id) => {
  const user = await prisma.user.findUnique({ where: { id }, select: userSelect });
  if (!user) throw new AppError('Usuario no encontrado.', 404);
  return user;
};

const create = async (data, req) => {
  const exists = await prisma.user.findUnique({ where: { email: data.email } });
  if (exists) throw new AppError('Ya existe un usuario con ese email.', 409);
  const passwordHash = await hash(data.password);
  const user = await prisma.user.create({
    data: { name: data.name, email: data.email, passwordHash, role: data.role, phone: data.phone },
    select: userSelect,
  });
  await createAuditLog({ userId: req.user?.id, userEmail: req.user?.email, action: 'CREATE_USER', entity: 'User', entityId: user.id, after: user, req });
  return user;
};

const update = async (id, data, req) => {
  const before = await getById(id);
  if (data.email) {
    const exists = await prisma.user.findFirst({ where: { email: data.email, id: { not: id } } });
    if (exists) throw new AppError('Email ya en uso.', 409);
  }
  const user = await prisma.user.update({ where: { id }, data: { name: data.name, email: data.email, phone: data.phone }, select: userSelect });
  await createAuditLog({ userId: req.user?.id, userEmail: req.user?.email, action: 'UPDATE_USER', entity: 'User', entityId: id, before, after: user, req });
  return user;
};

const toggleActive = async (id, req) => {
  const user = await getById(id);
  const updated = await prisma.user.update({ where: { id }, data: { isActive: !user.isActive }, select: userSelect });
  await createAuditLog({ userId: req.user?.id, userEmail: req.user?.email, action: updated.isActive ? 'ACTIVATE_USER' : 'DEACTIVATE_USER', entity: 'User', entityId: id, req });
  return updated;
};

const updateRole = async (id, role, req) => {
  const before = await getById(id);
  const user = await prisma.user.update({ where: { id }, data: { role }, select: userSelect });
  await createAuditLog({ userId: req.user?.id, userEmail: req.user?.email, action: 'CHANGE_ROLE', entity: 'User', entityId: id, before: { role: before.role }, after: { role }, req });
  return user;
};

const uploadAvatar = async (id, filename) => {
  const avatarUrl = `/uploads/avatars/${filename}`;
  return prisma.user.update({ where: { id }, data: { avatar: avatarUrl }, select: userSelect });
};

module.exports = { getAll, getById, create, update, toggleActive, updateRole, uploadAvatar };
