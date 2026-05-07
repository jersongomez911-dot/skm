const express = require('express');
const router = express.Router();
const ctrl = require('./checklists.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireMinRole } = require('../../middleware/roles.middleware');
const { validate } = require('../../middleware/validate.middleware');
const { uploadPhoto } = require('../../middleware/upload.middleware');
const v = require('./checklists.validators');

router.use(authenticate);

// Templates
router.get('/templates', ctrl.getTemplates);
router.get('/templates/:id', ctrl.getTemplateById);
router.post('/templates', requireMinRole('SUPERVISOR'), v.createTemplate, validate, ctrl.createTemplate);
router.put('/templates/:id', requireMinRole('SUPERVISOR'), v.createTemplate, validate, ctrl.updateTemplate);
router.delete('/templates/:id', requireMinRole('ADMIN'), ctrl.deleteTemplate);

// Checklists
router.get('/service/:serviceId', ctrl.getByService);
router.post('/service/:serviceId', requireMinRole('MECHANIC'), v.create, validate, ctrl.create);
router.patch('/:id/items/:itemId', requireMinRole('MECHANIC'), v.updateItem, validate, ctrl.updateItem);
router.post('/:id/items/:itemId/photo', requireMinRole('MECHANIC'), uploadPhoto.single('photo'), ctrl.uploadItemPhoto);
router.patch('/:id/complete', requireMinRole('MECHANIC'), ctrl.complete);

module.exports = router;
