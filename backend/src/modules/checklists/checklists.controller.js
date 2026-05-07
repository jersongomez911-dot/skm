const svc = require('./checklists.service');
const { success, created } = require('../../utils/response.utils');

const getTemplates = async (req, res, next) => { try { success(res, await svc.getTemplates()); } catch (e) { next(e); } };
const getTemplateById = async (req, res, next) => { try { success(res, await svc.getTemplateById(req.params.id)); } catch (e) { next(e); } };
const createTemplate = async (req, res, next) => { try { created(res, await svc.createTemplate(req.body), 'Plantilla creada.'); } catch (e) { next(e); } };
const updateTemplate = async (req, res, next) => { try { success(res, await svc.updateTemplate(req.params.id, req.body), 'Plantilla actualizada.'); } catch (e) { next(e); } };
const deleteTemplate = async (req, res, next) => { try { await svc.deleteTemplate(req.params.id); success(res, null, 'Plantilla desactivada.'); } catch (e) { next(e); } };
const getByService = async (req, res, next) => { try { success(res, await svc.getByService(req.params.serviceId)); } catch (e) { next(e); } };
const create = async (req, res, next) => { try { created(res, await svc.create(req.params.serviceId, req.body, req.user.id), 'Checklist creado.'); } catch (e) { next(e); } };
const updateItem = async (req, res, next) => { try { success(res, await svc.updateItem(req.params.id, req.params.itemId, req.body), 'Ítem actualizado.'); } catch (e) { next(e); } };
const uploadItemPhoto = async (req, res, next) => {
  try {
    if (!req.file) return next(new Error('Foto requerida.'));
    success(res, await svc.uploadItemPhoto(req.params.id, req.params.itemId, req.file.filename), 'Foto subida.');
  } catch (e) { next(e); }
};
const complete = async (req, res, next) => { try { success(res, await svc.complete(req.params.id, req.user.id), 'Checklist completado.'); } catch (e) { next(e); } };

module.exports = { getTemplates, getTemplateById, createTemplate, updateTemplate, deleteTemplate, getByService, create, updateItem, uploadItemPhoto, complete };
