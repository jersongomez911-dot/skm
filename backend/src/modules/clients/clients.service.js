const { prisma } = require('../../config/database');
const { AppError } = require('../../middleware/errorHandler.middleware');
const { createAuditLog } = require('../../middleware/audit.middleware');

const clientInclude = { photos: true, _count: { select: { motorcycles: true } } };

const getAll = async ({ search, isActive, city, page = 1, limit = 20 }) => {
  const where = {};
  if (search) where.OR = [
    { fullName: { contains: search } },
    { email: { contains: search } },
    { documentNumber: { contains: search } },
    { phone: { contains: search } },
  ];
  if (isActive !== undefined) where.isActive = isActive === 'true';
  if (city) where.city = { contains: city };

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [data, total] = await Promise.all([
    prisma.client.findMany({ where, include: clientInclude, orderBy: { fullName: 'asc' }, skip, take: parseInt(limit) }),
    prisma.client.count({ where }),
  ]);
  return { data, total };
};

const getById = async (id) => {
  const client = await prisma.client.findUnique({
    where: { id },
    include: { photos: true, motorcycles: { include: { _count: { select: { services: true } } } } },
  });
  if (!client) throw new AppError('Cliente no encontrado.', 404);
  return client;
};

const getServiceHistory = async (id, { page = 1, limit = 10 }) => {
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [data, total] = await Promise.all([
    prisma.service.findMany({
      where: { motorcycle: { clientId: id } },
      include: { motorcycle: true, technician: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      skip, take: parseInt(limit),
    }),
    prisma.service.count({ where: { motorcycle: { clientId: id } } }),
  ]);
  return { data, total };
};

const create = async (data, req) => {
  const [emailExists, docExists] = await Promise.all([
    prisma.client.findUnique({ where: { email: data.email } }),
    prisma.client.findUnique({ where: { documentNumber: data.documentNumber } }),
  ]);
  if (emailExists) throw new AppError('Email ya registrado.', 409);
  if (docExists) throw new AppError('Documento ya registrado.', 409);

  const client = await prisma.client.create({
    data: { ...data, birthDate: data.birthDate ? new Date(data.birthDate) : null },
    include: clientInclude,
  });
  await createAuditLog({ userId: req.user?.id, userEmail: req.user?.email, action: 'CREATE_CLIENT', entity: 'Client', entityId: client.id, after: client, req });
  return client;
};

const update = async (id, data, req) => {
  const before = await getById(id);
  if (data.email && data.email !== before.email) {
    const exists = await prisma.client.findFirst({ where: { email: data.email, id: { not: id } } });
    if (exists) throw new AppError('Email ya en uso.', 409);
  }
  const client = await prisma.client.update({
    where: { id },
    data: { ...data, birthDate: data.birthDate ? new Date(data.birthDate) : undefined },
    include: clientInclude,
  });
  await createAuditLog({ userId: req.user?.id, userEmail: req.user?.email, action: 'UPDATE_CLIENT', entity: 'Client', entityId: id, before, after: client, req });
  return client;
};

const toggleActive = async (id, req) => {
  const client = await getById(id);
  const updated = await prisma.client.update({ where: { id }, data: { isActive: !client.isActive }, include: clientInclude });
  await createAuditLog({ userId: req.user?.id, userEmail: req.user?.email, action: 'TOGGLE_CLIENT', entity: 'Client', entityId: id, req });
  return updated;
};

const uploadPhotos = async (id, files, userId) => {
  const photos = files.map(f => ({
    entityType: 'client', entityId: id,
    url: `/uploads/photos/${f.filename}`, filename: f.filename,
    size: f.size, mimeType: f.mimetype, uploadedBy: userId,
  }));
  await prisma.photo.createMany({ data: photos });
  return prisma.client.findUnique({ where: { id }, include: clientInclude });
};

const deletePhoto = async (id, photoId) => {
  await prisma.photo.delete({ where: { id: photoId } });
};

module.exports = { getAll, getById, getServiceHistory, create, update, toggleActive, uploadPhotos, deletePhoto };
