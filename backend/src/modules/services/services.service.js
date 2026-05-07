const { prisma } = require('../../config/database');
const { AppError } = require('../../middleware/errorHandler.middleware');
const { createAuditLog } = require('../../middleware/audit.middleware');
const { generateServiceQR } = require('../../utils/qrcode.utils');

// Valid state transitions
const STATE_MACHINE = {
  PENDING: ['DIAGNOSIS', 'CANCELLED'],
  DIAGNOSIS: ['IN_PROGRESS', 'WAITING_PARTS', 'CANCELLED', 'PENDING'],
  IN_PROGRESS: ['WAITING_PARTS', 'PAUSED', 'DONE', 'CANCELLED'],
  WAITING_PARTS: ['IN_PROGRESS', 'PAUSED', 'CANCELLED'],
  PAUSED: ['IN_PROGRESS', 'CANCELLED'],
  DONE: ['DELIVERED', 'IN_PROGRESS'],
  DELIVERED: [],
  CANCELLED: [],
};

const serviceInclude = {
  motorcycle: { include: { client: { select: { id: true, fullName: true, email: true, phone: true } } } },
  technician: { select: { id: true, name: true, email: true } },
  receptionist: { select: { id: true, name: true } },
  items: { include: { inventoryItem: { select: { name: true, sku: true } } } },
  checklists: { include: { items: true } },
  photos: true,
  statusHistory: { orderBy: { createdAt: 'desc' }, take: 20 },
};

const getAll = async ({ search, status, priority, technicianId, motorcycleId, dateFrom, dateTo, page = 1, limit = 20 }) => {
  const where = {};
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (technicianId) where.technicianId = technicianId;
  if (motorcycleId) where.motorcycleId = motorcycleId;
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lte = new Date(dateTo);
  }
  if (search) where.OR = [
    { motorcycle: { vin: { contains: search } } },
    { motorcycle: { brand: { contains: search } } },
    { motorcycle: { client: { fullName: { contains: search } } } },
  ];

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [data, total] = await Promise.all([
    prisma.service.findMany({ where, include: serviceInclude, orderBy: { createdAt: 'desc' }, skip, take: parseInt(limit) }),
    prisma.service.count({ where }),
  ]);
  return { data, total };
};

const getById = async (id) => {
  const s = await prisma.service.findUnique({ where: { id }, include: serviceInclude });
  if (!s) throw new AppError('Servicio no encontrado.', 404);
  return s;
};

const getStats = async () => {
  const [total, byStatus, byPriority, overdue] = await Promise.all([
    prisma.service.count(),
    prisma.service.groupBy({ by: ['status'], _count: { status: true } }),
    prisma.service.groupBy({ by: ['priority'], _count: { priority: true } }),
    prisma.service.count({
      where: {
        status: { in: ['PENDING', 'DIAGNOSIS', 'IN_PROGRESS', 'WAITING_PARTS'] },
        slaHours: { not: null },
        createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    }),
  ]);
  return { total, byStatus, byPriority, overdue };
};

const create = async (data, req) => {
  const moto = await prisma.motorcycle.findUnique({ where: { id: data.motorcycleId } });
  if (!moto) throw new AppError('Motocicleta no encontrada.', 404);

  const service = await prisma.service.create({
    data: { ...data, receptionistId: req.user.id },
    include: serviceInclude,
  });

  // Log initial status
  await prisma.serviceStatusHistory.create({ data: { serviceId: service.id, toStatus: 'PENDING', changedById: req.user.id } });

  // Generate QR
  const qr = await generateServiceQR(service.id);
  await prisma.service.update({ where: { id: service.id }, data: { qrCode: qr } });

  await createAuditLog({ userId: req.user?.id, userEmail: req.user?.email, action: 'CREATE_SERVICE', entity: 'Service', entityId: service.id, req });
  return { ...service, qrCode: qr };
};

const update = async (id, data, req) => {
  const before = await getById(id);
  if (['DELIVERED', 'CANCELLED'].includes(before.status)) {
    throw new AppError('No se puede editar un servicio entregado o cancelado.', 400);
  }

  // Pick only valid updateable fields to avoid Prisma relation errors
  const allowedFields = [
    'status', 'priority', 'slaHours', 'estimatedHours', 'estimatedCost', 
    'laborCost', 'partsCost', 'totalCost', 'observations', 'techNotes', 
    'diagnosis', 'accessories', 'damageReport', 'technicianId'
  ];
  
  const updateData = {};
  allowedFields.forEach(f => { if (data.hasOwnProperty(f)) updateData[f] = data[f]; });

  // If updating laborCost, ensure we recalculate totalCost in the same operation if possible
  // or at least trigger it correctly.
  if ('laborCost' in updateData) {
    const items = await prisma.serviceItem.findMany({ where: { serviceId: id } });
    const partsCost = items.reduce((sum, i) => sum + i.totalCost, 0);
    updateData.partsCost = partsCost;
    updateData.totalCost = partsCost + Number(updateData.laborCost);
  }

  const updated = await prisma.service.update({ 
    where: { id }, 
    data: updateData, 
    include: serviceInclude 
  });

  await createAuditLog({ userId: req.user?.id, userEmail: req.user?.email, action: 'UPDATE_SERVICE', entity: 'Service', entityId: id, before, after: updated, req });
  return updated;
};

const updateStatus = async (id, { status, notes }, req) => {
  const current = await getById(id);
  const allowed = STATE_MACHINE[current.status] || [];
  if (!allowed.includes(status)) {
    throw new AppError(`Transición inválida: ${current.status} → ${status}. Permitidas: ${allowed.join(', ')}`, 400);
  }

  // Enforce business rules
  if (status === 'DONE') {
    const checklist = await prisma.checklist.findFirst({ where: { serviceId: id } });
    if (!checklist) throw new AppError('Debe completar el checklist antes de marcar como terminado.', 400);
    const pendingRequired = await prisma.checklistItem.count({ where: { checklistId: checklist.id, isRequired: true, status: { not: 'OK' } } });
    if (pendingRequired > 0) throw new AppError(`Hay ${pendingRequired} ítem(s) obligatorios del checklist sin completar.`, 400);
    if (!current.technicianId) throw new AppError('Debe asignar un técnico antes de marcar como terminado.', 400);
  }

  const extraData = {};
  if (status === 'DELIVERED') extraData.deliveredAt = new Date();

  const updated = await prisma.service.update({ where: { id }, data: { status, ...extraData }, include: serviceInclude });
  await prisma.serviceStatusHistory.create({ data: { serviceId: id, fromStatus: current.status, toStatus: status, notes, changedById: req.user.id } });
  await createAuditLog({ userId: req.user?.id, userEmail: req.user?.email, action: 'STATUS_CHANGE', entity: 'Service', entityId: id, before: { status: current.status }, after: { status }, req });

  return updated;
};

const assignTechnician = async (id, technicianId, req) => {
  const tech = await prisma.user.findUnique({ where: { id: technicianId } });
  if (!tech || !['MECHANIC', 'SUPERVISOR', 'ADMIN'].includes(tech.role)) {
    throw new AppError('Técnico no válido.', 400);
  }
  const updated = await prisma.service.update({ where: { id }, data: { technicianId }, include: serviceInclude });
  await createAuditLog({ userId: req.user?.id, userEmail: req.user?.email, action: 'ASSIGN_TECHNICIAN', entity: 'Service', entityId: id, after: { technicianId }, req });
  return updated;
};

const addItem = async (id, data, req) => {
  const totalCost = data.quantity * data.unitCost;

  // If linked to inventory, update stock
  if (data.inventoryItemId) {
    const item = await prisma.inventoryItem.findUnique({ where: { id: data.inventoryItemId } });
    if (!item) throw new AppError('Repuesto no encontrado.', 404);
    if (item.quantity < data.quantity) throw new AppError(`Stock insuficiente. Disponible: ${item.quantity}`, 400);
    await prisma.inventoryItem.update({ where: { id: data.inventoryItemId }, data: { quantity: { decrement: data.quantity } } });
    await prisma.stockMovement.create({
      data: { inventoryItemId: data.inventoryItemId, type: 'SERVICE_USE', quantity: -data.quantity, previousStock: item.quantity, newStock: item.quantity - data.quantity, reference: `Servicio #${id.slice(-6)}`, userId: req.user.id },
    });
  }

  const serviceItem = await prisma.serviceItem.create({
    data: { serviceId: id, inventoryItemId: data.inventoryItemId || null, description: data.description, quantity: data.quantity, unitCost: data.unitCost, totalCost },
    include: { inventoryItem: { select: { name: true, sku: true } } },
  });

  // Recalculate totals
  await recalculateCosts(id);
  return serviceItem;
};

const removeItem = async (id, itemId, req) => {
  const item = await prisma.serviceItem.findUnique({ where: { id: itemId } });
  if (!item) throw new AppError('Ítem no encontrado.', 404);

  // Restore stock if linked
  if (item.inventoryItemId) {
    const inv = await prisma.inventoryItem.findUnique({ where: { id: item.inventoryItemId } });
    if (inv) {
      await prisma.inventoryItem.update({ where: { id: item.inventoryItemId }, data: { quantity: { increment: item.quantity } } });
    }
  }

  await prisma.serviceItem.delete({ where: { id: itemId } });
  await recalculateCosts(id);
};

const recalculateCosts = async (serviceId, manualLaborCost = undefined) => {
  const items = await prisma.serviceItem.findMany({ where: { serviceId } });
  const partsCost = items.reduce((sum, i) => sum + i.totalCost, 0);
  
  let laborCost = manualLaborCost;
  if (laborCost === undefined) {
    const s = await prisma.service.findUnique({ where: { id: serviceId }, select: { laborCost: true } });
    laborCost = s?.laborCost || 0;
  }
  
  const totalCost = partsCost + Number(laborCost);
  
  console.log(`[DEBUG] Recalculating Service ${serviceId}: parts=${partsCost}, labor=${laborCost}, total=${totalCost}`);
  
  await prisma.service.update({ 
    where: { id: serviceId }, 
    data: { partsCost, totalCost } 
  });
};

const uploadPhotos = async (id, files, userId) => {
  const photos = files.map(f => ({ entityType: 'service', entityId: id, url: `/uploads/photos/${f.filename}`, filename: f.filename, size: f.size, mimeType: f.mimetype, uploadedBy: userId }));
  await prisma.photo.createMany({ data: photos });
  return getById(id);
};

const uploadSignature = async (id, filename) => {
  const signatureUrl = `/uploads/signatures/${filename}`;
  return prisma.service.update({ where: { id }, data: { signatureUrl }, include: serviceInclude });
};

const getQR = async (id) => {
  const s = await prisma.service.findUnique({ where: { id }, select: { qrCode: true, id: true, status: true } });
  if (!s) throw new AppError('Servicio no encontrado.', 404);
  if (!s.qrCode) {
    const qr = await generateServiceQR(id);
    await prisma.service.update({ where: { id }, data: { qrCode: qr } });
    return { ...s, qrCode: qr };
  }
  return s;
};

module.exports = { getAll, getById, getStats, create, update, updateStatus, assignTechnician, addItem, removeItem, uploadPhotos, uploadSignature, getQR };
