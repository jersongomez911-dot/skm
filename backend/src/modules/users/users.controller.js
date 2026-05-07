const service = require('./users.service');
const { success, paginated, created, buildPaginationMeta } = require('../../utils/response.utils');

const getAll = async (req, res, next) => {
  try {
    const { search, role, isActive, page = 1, limit = 20 } = req.query;
    const { data, total } = await service.getAll({ search, role, isActive, page, limit });
    paginated(res, data, buildPaginationMeta(total, page, limit));
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const user = await service.getById(req.params.id);
    success(res, user);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const user = await service.create(req.body, req);
    created(res, user, 'Usuario creado exitosamente.');
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const user = await service.update(req.params.id, req.body, req);
    success(res, user, 'Usuario actualizado.');
  } catch (err) { next(err); }
};

const toggleActive = async (req, res, next) => {
  try {
    const user = await service.toggleActive(req.params.id, req);
    success(res, user, `Usuario ${user.isActive ? 'activado' : 'desactivado'}.`);
  } catch (err) { next(err); }
};

const updateRole = async (req, res, next) => {
  try {
    const user = await service.updateRole(req.params.id, req.body.role, req);
    success(res, user, 'Rol actualizado.');
  } catch (err) { next(err); }
};

const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) return next(new Error('Archivo requerido.'));
    const user = await service.uploadAvatar(req.params.id, req.file.filename);
    success(res, user, 'Avatar actualizado.');
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, update, toggleActive, updateRole, uploadAvatar };
