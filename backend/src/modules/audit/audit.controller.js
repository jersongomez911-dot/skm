const svc = require('./audit.service');
const { success, paginated, buildPaginationMeta } = require('../../utils/response.utils');

const getAll = async (req, res, next) => {
  try {
    const { entity, action, userId, dateFrom, dateTo, page = 1, limit = 30 } = req.query;
    const { data, total } = await svc.getAll({ entity, action, userId, dateFrom, dateTo, page, limit });
    paginated(res, data, buildPaginationMeta(total, page, limit));
  } catch (err) { next(err); }
};

const getStats = async (req, res, next) => { try { success(res, await svc.getStats()); } catch (err) { next(err); } };

module.exports = { getAll, getStats };
