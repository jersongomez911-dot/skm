const svc = require('./services.service');
const { success, paginated, created, buildPaginationMeta } = require('../../utils/response.utils');

const getAll = async (req, res, next) => {
  try {
    const { search, status, priority, technicianId, motorcycleId, dateFrom, dateTo, page = 1, limit = 20 } = req.query;
    const { data, total } = await svc.getAll({ search, status, priority, technicianId, motorcycleId, dateFrom, dateTo, page, limit });
    paginated(res, data, buildPaginationMeta(total, page, limit));
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try { success(res, await svc.getById(req.params.id)); } catch (err) { next(err); }
};

const getStats = async (req, res, next) => {
  try { success(res, await svc.getStats()); } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try { created(res, await svc.create(req.body, req), 'Servicio creado.'); } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try { success(res, await svc.update(req.params.id, req.body, req), 'Servicio actualizado.'); } catch (err) { next(err); }
};

const updateStatus = async (req, res, next) => {
  try { success(res, await svc.updateStatus(req.params.id, req.body, req), 'Estado actualizado.'); } catch (err) { next(err); }
};

const assignTechnician = async (req, res, next) => {
  try { success(res, await svc.assignTechnician(req.params.id, req.body.technicianId, req), 'Técnico asignado.'); } catch (err) { next(err); }
};

const addItem = async (req, res, next) => {
  try { created(res, await svc.addItem(req.params.id, req.body, req), 'Ítem agregado.'); } catch (err) { next(err); }
};

const removeItem = async (req, res, next) => {
  try { await svc.removeItem(req.params.id, req.params.itemId, req); success(res, null, 'Ítem eliminado.'); } catch (err) { next(err); }
};

const uploadPhotos = async (req, res, next) => {
  try {
    if (!req.files?.length) return next(new Error('Archivos requeridos.'));
    success(res, await svc.uploadPhotos(req.params.id, req.files, req.user.id), 'Fotos subidas.');
  } catch (err) { next(err); }
};

const uploadSignature = async (req, res, next) => {
  try {
    if (!req.file) return next(new Error('Firma requerida.'));
    success(res, await svc.uploadSignature(req.params.id, req.file.filename), 'Firma guardada.');
  } catch (err) { next(err); }
};

const getQR = async (req, res, next) => {
  try { success(res, await svc.getQR(req.params.id)); } catch (err) { next(err); }
};

module.exports = { getAll, getById, getStats, create, update, updateStatus, assignTechnician, addItem, removeItem, uploadPhotos, uploadSignature, getQR };
