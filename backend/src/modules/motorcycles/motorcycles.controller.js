const service = require('./motorcycles.service');
const { success, paginated, created, buildPaginationMeta } = require('../../utils/response.utils');

const getAll = async (req, res, next) => {
  try {
    const { search, clientId, status, brand, page = 1, limit = 20 } = req.query;
    const { data, total } = await service.getAll({ search, clientId, status, brand, page, limit });
    paginated(res, data, buildPaginationMeta(total, page, limit));
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try { success(res, await service.getById(req.params.id)); } catch (err) { next(err); }
};

const getServiceHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const { data, total } = await service.getServiceHistory(req.params.id, { page, limit });
    paginated(res, data, buildPaginationMeta(total, page, limit));
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try { created(res, await service.create(req.body, req), 'Motocicleta registrada.'); } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try { success(res, await service.update(req.params.id, req.body, req), 'Motocicleta actualizada.'); } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try { await service.remove(req.params.id, req); success(res, null, 'Motocicleta eliminada.'); } catch (err) { next(err); }
};

const uploadPhotos = async (req, res, next) => {
  try {
    if (!req.files?.length) return next(new Error('Archivos requeridos.'));
    success(res, await service.uploadPhotos(req.params.id, req.files, req.user.id), 'Fotos subidas.');
  } catch (err) { next(err); }
};

const getQR = async (req, res, next) => {
  try { success(res, await service.getQR(req.params.id)); } catch (err) { next(err); }
};

module.exports = { getAll, getById, getServiceHistory, create, update, remove, uploadPhotos, getQR };
