const svc = require('./inventory.service');
const { success, paginated, created, buildPaginationMeta } = require('../../utils/response.utils');

const getAll = async (req, res, next) => {
  try {
    const { search, category, supplierId, isActive, lowStock, page = 1, limit = 20 } = req.query;
    const { data, total } = await svc.getAll({ search, category, supplierId, isActive, lowStock, page, limit });
    paginated(res, data, buildPaginationMeta(total, page, limit));
  } catch (err) { next(err); }
};

const getLowStock = async (req, res, next) => { try { success(res, await svc.getLowStock(), 'Repuestos con stock bajo.'); } catch (err) { next(err); } };
const getById = async (req, res, next) => { try { success(res, await svc.getById(req.params.id)); } catch (err) { next(err); } };
const getItemMovements = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const { data, total } = await svc.getItemMovements(req.params.id, { page, limit });
    paginated(res, data, buildPaginationMeta(total, page, limit));
  } catch (err) { next(err); }
};
const getMovements = async (req, res, next) => {
  try {
    const { page = 1, limit = 30, type, dateFrom, dateTo } = req.query;
    const { data, total } = await svc.getMovements({ page, limit, type, dateFrom, dateTo });
    paginated(res, data, buildPaginationMeta(total, page, limit));
  } catch (err) { next(err); }
};
const create = async (req, res, next) => { try { created(res, await svc.create(req.body, req), 'Repuesto creado.'); } catch (err) { next(err); } };
const update = async (req, res, next) => { try { success(res, await svc.update(req.params.id, req.body, req), 'Repuesto actualizado.'); } catch (err) { next(err); } };
const toggleActive = async (req, res, next) => { try { success(res, await svc.toggleActive(req.params.id, req)); } catch (err) { next(err); } };
const addStockMovement = async (req, res, next) => { try { created(res, await svc.addStockMovement(req.params.id, req.body, req), 'Movimiento registrado.'); } catch (err) { next(err); } };

module.exports = { getAll, getLowStock, getById, getItemMovements, getMovements, create, update, toggleActive, addStockMovement };
