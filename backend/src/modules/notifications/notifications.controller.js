const svc = require('./notifications.service');
const { success, paginated, buildPaginationMeta } = require('../../utils/response.utils');

const getAll = async (req, res, next) => {
  try {
    const { isRead, page = 1, limit = 20 } = req.query;
    const { data, total } = await svc.getAll(req.user.id, { isRead, page, limit });
    paginated(res, data, buildPaginationMeta(total, page, limit));
  } catch (err) { next(err); }
};
const getUnreadCount = async (req, res, next) => { try { success(res, { count: await svc.getUnreadCount(req.user.id) }); } catch (err) { next(err); } };
const markRead = async (req, res, next) => { try { success(res, await svc.markRead(req.params.id, req.user.id), 'Notificación marcada como leída.'); } catch (err) { next(err); } };
const markAllRead = async (req, res, next) => { try { await svc.markAllRead(req.user.id); success(res, null, 'Todas leídas.'); } catch (err) { next(err); } };
const remove = async (req, res, next) => { try { await svc.remove(req.params.id, req.user.id); success(res, null, 'Notificación eliminada.'); } catch (err) { next(err); } };

module.exports = { getAll, getUnreadCount, markRead, markAllRead, remove };
