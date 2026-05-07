const { prisma } = require('../../config/database');
const { AppError } = require('../../middleware/errorHandler.middleware');
const { createAuditLog } = require('../../middleware/audit.middleware');

const itemInclude = { supplier: { select: { id: true, name: true } } };

const getAll = async ({ search, category, supplierId, isActive, lowStock, page = 1, limit = 20 }) => {
  const where = {};
  if (search) where.OR = [{ name: { contains: search } }, { sku: { contains: search } }, { brand: { contains: search } }];
  if (category) where.category = { contains: category };
  if (supplierId) where.supplierId = supplierId;
  if (isActive !== undefined) where.isActive = isActive === 'true';
  if (lowStock === 'true') where.quantity = { lte: prisma.inventoryItem.fields.minStock };

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [data, total] = await Promise.all([
    prisma.inventoryItem.findMany({ where, include: itemInclude, orderBy: { name: 'asc' }, skip, take: parseInt(limit) }),
    prisma.inventoryItem.count({ where }),
  ]);
  return { data, total };
};

const getLowStock = async () => {
  // Items where quantity <= minStock
  const items = await prisma.$queryRaw`SELECT * FROM inventory_items WHERE quantity <= minStock AND isActive = 1 ORDER BY (quantity - minStock) ASC`;
  return items;
};

const getById = async (id) => {
  const item = await prisma.inventoryItem.findUnique({ where: { id }, include: { ...itemInclude, _count: { select: { movements: true, serviceItems: true } } } });
  if (!item) throw new AppError('Repuesto no encontrado.', 404);
  return item;
};

const getItemMovements = async (id, { page = 1, limit = 20 }) => {
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [data, total] = await Promise.all([
    prisma.stockMovement.findMany({ where: { inventoryItemId: id }, include: { user: { select: { name: true } } }, orderBy: { createdAt: 'desc' }, skip, take: parseInt(limit) }),
    prisma.stockMovement.count({ where: { inventoryItemId: id } }),
  ]);
  return { data, total };
};

const getMovements = async ({ page = 1, limit = 30, type, dateFrom, dateTo }) => {
  const where = {};
  if (type) where.type = type;
  if (dateFrom || dateTo) { where.createdAt = {}; if (dateFrom) where.createdAt.gte = new Date(dateFrom); if (dateTo) where.createdAt.lte = new Date(dateTo); }
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [data, total] = await Promise.all([
    prisma.stockMovement.findMany({ where, include: { inventoryItem: { select: { name: true, sku: true } }, user: { select: { name: true } } }, orderBy: { createdAt: 'desc' }, skip, take: parseInt(limit) }),
    prisma.stockMovement.count({ where }),
  ]);
  return { data, total };
};

const create = async (data, req) => {
  const skuExists = await prisma.inventoryItem.findUnique({ where: { sku: data.sku } });
  if (skuExists) throw new AppError('SKU ya registrado.', 409);
  const item = await prisma.inventoryItem.create({ data, include: itemInclude });

  if (data.quantity > 0) {
    await prisma.stockMovement.create({ data: { inventoryItemId: item.id, type: 'ENTRY', quantity: data.quantity, previousStock: 0, newStock: data.quantity, reference: 'Stock inicial', userId: req.user?.id, unitCost: data.unitCost } });
  }

  await createAuditLog({ userId: req.user?.id, userEmail: req.user?.email, action: 'CREATE_INVENTORY', entity: 'InventoryItem', entityId: item.id, after: item, req });
  return item;
};

const update = async (id, data, req) => {
  const before = await getById(id);
  const item = await prisma.inventoryItem.update({ where: { id }, data, include: itemInclude });
  await createAuditLog({ userId: req.user?.id, userEmail: req.user?.email, action: 'UPDATE_INVENTORY', entity: 'InventoryItem', entityId: id, before, after: item, req });
  return item;
};

const toggleActive = async (id, req) => {
  const item = await getById(id);
  return prisma.inventoryItem.update({ where: { id }, data: { isActive: !item.isActive }, include: itemInclude });
};

const addStockMovement = async (id, data, req) => {
  const item = await getById(id);
  let newQty;

  if (data.type === 'ENTRY') {
    newQty = item.quantity + data.quantity;
  } else if (data.type === 'EXIT') {
    if (item.quantity < data.quantity) throw new AppError(`Stock insuficiente. Disponible: ${item.quantity}`, 400);
    newQty = item.quantity - data.quantity;
  } else if (data.type === 'ADJUSTMENT') {
    newQty = data.quantity; // absolute value
  }

  await prisma.inventoryItem.update({ where: { id }, data: { quantity: newQty } });
  const movement = await prisma.stockMovement.create({
    data: { inventoryItemId: id, type: data.type, quantity: data.type === 'EXIT' ? -data.quantity : data.quantity, previousStock: item.quantity, newStock: newQty, reference: data.reference, notes: data.notes, userId: req.user?.id, unitCost: data.unitCost },
    include: { user: { select: { name: true } } },
  });

  await createAuditLog({ userId: req.user?.id, userEmail: req.user?.email, action: `STOCK_${data.type}`, entity: 'InventoryItem', entityId: id, before: { quantity: item.quantity }, after: { quantity: newQty }, req });
  return movement;
};

module.exports = { getAll, getLowStock, getById, getItemMovements, getMovements, create, update, toggleActive, addStockMovement };
