const { prisma } = require('../../config/database');
const { AppError } = require('../../middleware/errorHandler.middleware');

const getTemplates = async () => prisma.checklistTemplate.findMany({ where: { isActive: true }, include: { templateItems: { orderBy: { order: 'asc' } }, _count: { select: { checklists: true } } } });
const getTemplateById = async (id) => {
  const t = await prisma.checklistTemplate.findUnique({ where: { id }, include: { templateItems: { orderBy: { order: 'asc' } } } });
  if (!t) throw new AppError('Plantilla no encontrada.', 404);
  return t;
};

const createTemplate = async (data) => {
  const { items, ...rest } = data;
  return prisma.checklistTemplate.create({
    data: { ...rest, templateItems: { create: items.map((item, i) => ({ ...item, order: item.order ?? i })) } },
    include: { templateItems: true },
  });
};

const updateTemplate = async (id, data) => {
  const { items, ...rest } = data;
  await prisma.checklistTemplateItem.deleteMany({ where: { templateId: id } });
  return prisma.checklistTemplate.update({
    where: { id }, data: { ...rest, templateItems: { create: items.map((item, i) => ({ ...item, order: item.order ?? i })) } },
    include: { templateItems: true },
  });
};

const deleteTemplate = async (id) => {
  await prisma.checklistTemplate.update({ where: { id }, data: { isActive: false } });
};

const getByService = async (serviceId) => prisma.checklist.findMany({
  where: { serviceId }, include: { items: { orderBy: { order: 'asc' } }, technician: { select: { name: true } }, template: { select: { name: true } } },
});

const create = async (serviceId, data, userId) => {
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) throw new AppError('Servicio no encontrado.', 404);
  if (['DELIVERED', 'CANCELLED'].includes(service.status)) throw new AppError('No se puede agregar checklist a un servicio cerrado.', 400);

  let items = [];
  if (data.templateId) {
    const template = await prisma.checklistTemplate.findUnique({ where: { id: data.templateId }, include: { templateItems: true } });
    if (!template) throw new AppError('Plantilla no encontrada.', 404);
    items = template.templateItems.map(ti => ({ category: ti.category, label: ti.label, isRequired: ti.isRequired, order: ti.order, status: 'PENDING' }));
  } else if (data.items?.length) {
    items = data.items.map((item, i) => ({ ...item, status: 'PENDING', order: item.order ?? i }));
  }

  return prisma.checklist.create({
    data: { serviceId, templateId: data.templateId || null, technicianId: userId, items: { create: items } },
    include: { items: { orderBy: { order: 'asc' } } },
  });
};

const updateItem = async (checklistId, itemId, data) => {
  const item = await prisma.checklistItem.findUnique({ where: { id: itemId } });
  if (!item || item.checklistId !== checklistId) throw new AppError('Ítem no encontrado.', 404);
  return prisma.checklistItem.update({ where: { id: itemId }, data: { status: data.status, notes: data.notes } });
};

const uploadItemPhoto = async (checklistId, itemId, filename) => {
  const url = `/uploads/photos/${filename}`;
  return prisma.checklistItem.update({ where: { id: itemId }, data: { photoUrl: url } });
};

const complete = async (checklistId, userId) => {
  const checklist = await prisma.checklist.findUnique({ where: { id: checklistId }, include: { items: true } });
  if (!checklist) throw new AppError('Checklist no encontrado.', 404);
  const pending = checklist.items.filter(i => i.isRequired && i.status === 'PENDING');
  if (pending.length > 0) throw new AppError(`Hay ${pending.length} ítem(s) obligatorios sin completar.`, 400);
  return prisma.checklist.update({ where: { id: checklistId }, data: { completedAt: new Date(), technicianId: userId }, include: { items: true } });
};

module.exports = { getTemplates, getTemplateById, createTemplate, updateTemplate, deleteTemplate, getByService, create, updateItem, uploadItemPhoto, complete };
