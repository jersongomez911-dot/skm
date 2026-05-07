const { prisma } = require('../../config/database');
const { AppError } = require('../../middleware/errorHandler.middleware');
const { createAuditLog } = require('../../middleware/audit.middleware');
const { generateMotorcycleQR } = require('../../utils/qrcode.utils');

const motoInclude = {
  client: { select: { id: true, fullName: true, documentNumber: true, phone: true } },
  photos: true,
  _count: { select: { services: true } },
};

const getAll = async ({ search, clientId, status, brand, page = 1, limit = 20 }) => {
  const where = {};
  if (search) where.OR = [
    { brand: { contains: search } }, { model: { contains: search } },
    { vin: { contains: search } }, { engineNumber: { contains: search } },
  ];
  if (clientId) where.clientId = clientId;
  if (status) where.status = status;
  if (brand) where.brand = { contains: brand };

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [data, total] = await Promise.all([
    prisma.motorcycle.findMany({ where, include: motoInclude, orderBy: { createdAt: 'desc' }, skip, take: parseInt(limit) }),
    prisma.motorcycle.count({ where }),
  ]);
  return { data, total };
};

const getById = async (id) => {
  const moto = await prisma.motorcycle.findUnique({ where: { id }, include: { ...motoInclude, services: { take: 5, orderBy: { createdAt: 'desc' }, include: { technician: { select: { name: true } } } } } });
  if (!moto) throw new AppError('Motocicleta no encontrada.', 404);
  return moto;
};

const getServiceHistory = async (id, { page = 1, limit = 10 }) => {
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [data, total] = await Promise.all([
    prisma.service.findMany({ where: { motorcycleId: id }, include: { technician: { select: { name: true } }, _count: { select: { items: true } } }, orderBy: { createdAt: 'desc' }, skip, take: parseInt(limit) }),
    prisma.service.count({ where: { motorcycleId: id } }),
  ]);
  return { data, total };
};

const create = async (data, req) => {
  const vinExists = await prisma.motorcycle.findUnique({ where: { vin: data.vin } });
  if (vinExists) throw new AppError('VIN ya registrado.', 409);

  const clientExists = await prisma.client.findUnique({ where: { id: data.clientId } });
  if (!clientExists) throw new AppError('Cliente no encontrado.', 404);

  const moto = await prisma.motorcycle.create({ data, include: motoInclude });

  // Generate QR
  const qr = await generateMotorcycleQR(moto.id);
  await prisma.motorcycle.update({ where: { id: moto.id }, data: { qrCode: qr } });

  await createAuditLog({ userId: req.user?.id, userEmail: req.user?.email, action: 'CREATE_MOTORCYCLE', entity: 'Motorcycle', entityId: moto.id, after: moto, req });
  return { ...moto, qrCode: qr };
};

const update = async (id, data, req) => {
  const before = await getById(id);
  if (data.vin && data.vin !== before.vin) {
    const vinExists = await prisma.motorcycle.findFirst({ where: { vin: data.vin, id: { not: id } } });
    if (vinExists) throw new AppError('VIN ya registrado.', 409);
  }
  if (data.mileage && before.mileage && data.mileage < before.mileage) {
    throw new AppError('El kilometraje no puede ser menor al actual.', 400);
  }
  const moto = await prisma.motorcycle.update({ where: { id }, data, include: motoInclude });
  await createAuditLog({ userId: req.user?.id, userEmail: req.user?.email, action: 'UPDATE_MOTORCYCLE', entity: 'Motorcycle', entityId: id, before, after: moto, req });
  return moto;
};

const remove = async (id, req) => {
  const active = await prisma.service.count({ where: { motorcycleId: id, status: { in: ['PENDING', 'DIAGNOSIS', 'IN_PROGRESS', 'WAITING_PARTS', 'PAUSED'] } } });
  if (active > 0) throw new AppError('No se puede eliminar: tiene servicios activos.', 400);
  await prisma.motorcycle.delete({ where: { id } });
  await createAuditLog({ userId: req.user?.id, userEmail: req.user?.email, action: 'DELETE_MOTORCYCLE', entity: 'Motorcycle', entityId: id, req });
};

const uploadPhotos = async (id, files, userId) => {
  const photos = files.map(f => ({ entityType: 'motorcycle', entityId: id, url: `/uploads/photos/${f.filename}`, filename: f.filename, size: f.size, mimeType: f.mimetype, uploadedBy: userId }));
  await prisma.photo.createMany({ data: photos });
  return getById(id);
};

const getQR = async (id) => {
  const moto = await prisma.motorcycle.findUnique({ where: { id }, select: { qrCode: true, brand: true, model: true, vin: true } });
  if (!moto) throw new AppError('Motocicleta no encontrada.', 404);
  if (!moto.qrCode) {
    const qr = await generateMotorcycleQR(id);
    await prisma.motorcycle.update({ where: { id }, data: { qrCode: qr } });
    return { ...moto, qrCode: qr };
  }
  return moto;
};

module.exports = { getAll, getById, getServiceHistory, create, update, remove, uploadPhotos, getQR };
