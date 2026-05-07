const express = require('express');
const router = express.Router();
const controller = require('./services.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireMinRole } = require('../../middleware/roles.middleware');
const { validate } = require('../../middleware/validate.middleware');
const { uploadPhoto, uploadSignature } = require('../../middleware/upload.middleware');
const v = require('./services.validators');

router.use(authenticate);

router.get('/', controller.getAll);
router.get('/stats', controller.getStats);
router.get('/:id', controller.getById);
router.post('/', requireMinRole('RECEPTIONIST'), v.create, validate, controller.create);
router.put('/:id', requireMinRole('MECHANIC'), v.update, validate, controller.update);
router.patch('/:id/status', requireMinRole('MECHANIC'), v.updateStatus, validate, controller.updateStatus);
router.patch('/:id/assign', requireMinRole('SUPERVISOR'), v.assign, validate, controller.assignTechnician);
router.post('/:id/items', requireMinRole('MECHANIC'), v.addItem, validate, controller.addItem);
router.delete('/:id/items/:itemId', requireMinRole('MECHANIC'), controller.removeItem);
router.post('/:id/photos', requireMinRole('MECHANIC'), uploadPhoto.array('photos', 10), controller.uploadPhotos);
router.post('/:id/signature', requireMinRole('RECEPTIONIST'), uploadSignature.single('signature'), controller.uploadSignature);
router.get('/:id/qr', controller.getQR);

module.exports = router;
