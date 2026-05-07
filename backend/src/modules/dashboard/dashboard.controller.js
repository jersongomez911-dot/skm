const svc = require('./dashboard.service');
const { success } = require('../../utils/response.utils');

const getKpis = async (req, res, next) => { try { success(res, await svc.getKpis()); } catch (err) { next(err); } };
const getCharts = async (req, res, next) => { try { success(res, await svc.getCharts()); } catch (err) { next(err); } };
const getAlerts = async (req, res, next) => { try { success(res, await svc.getAlerts()); } catch (err) { next(err); } };
const getRecentServices = async (req, res, next) => { try { success(res, await svc.getRecentServices()); } catch (err) { next(err); } };
const getTopTechnicians = async (req, res, next) => { try { success(res, await svc.getTopTechnicians()); } catch (err) { next(err); } };

module.exports = { getKpis, getCharts, getAlerts, getRecentServices, getTopTechnicians };
