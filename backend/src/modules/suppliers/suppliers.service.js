const { prisma } = require('../../config/database');
const { AppError } = require('../../middleware/errorHandler.middleware');

const getAll = async ({ search, isActive, page = 1, limit = 20 }) => {
  const where = {};
  if (search) where.OR = [{ name: { contains: search } }, { email: { contains: search } }, { contact: { contains: search } }];
  if (isActive !== undefined) where.isActive = isActive === 'true';
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [data, total] = await Promise.all([
    prisma.supplier.findMany({ where, include: { _count: { select: { items: true } } }, orderBy: { name: 'asc' }, skip, take: parseInt(limit) }),
    prisma.supplier.count({ where }),
  ]);
  return { data, total };
};

const getById = async (id) => {
  const s = await prisma.supplier.findUnique({ where: { id }, include: { items: { where: { isActive: true } } } });
  if (!s) throw new AppError('Proveedor no encontrado.', 404);
  return s;
};

const create = async (data) => prisma.supplier.create({ data });
const update = async (id, data) => { await getById(id); return prisma.supplier.update({ where: { id }, data }); };
const toggleActive = async (id) => { const s = await getById(id); return prisma.supplier.update({ where: { id }, data: { isActive: !s.isActive } }); };

module.exports = { getAll, getById, create, update, toggleActive };
