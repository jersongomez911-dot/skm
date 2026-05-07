const svc = require('./suppliers.service');
const { success, paginated, created, buildPaginationMeta } = require('../../utils/response.utils');

const getAll = async (req, res, next) => {
  try {
    const { search, isActive, page = 1, limit = 20 } = req.query;
    const { data, total } = await svc.getAll({ search, isActive, page, limit });
    paginated(res, data, buildPaginationMeta(total, page, limit));
  } catch (err) { next(err); }
};
const getById = async (req, res, next) => { try { success(res, await svc.getById(req.params.id)); } catch (err) { next(err); } };
const create = async (req, res, next) => { try { created(res, await svc.create(req.body), 'Proveedor creado.'); } catch (err) { next(err); } };
const update = async (req, res, next) => { try { success(res, await svc.update(req.params.id, req.body), 'Proveedor actualizado.'); } catch (err) { next(err); } };
const toggleActive = async (req, res, next) => { try { success(res, await svc.toggleActive(req.params.id)); } catch (err) { next(err); } };

module.exports = { getAll, getById, create, update, toggleActive };
