const express = require('express');
const router = express.Router();
const controller = require('./clients.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireMinRole } = require('../../middleware/roles.middleware');
const { validate } = require('../../middleware/validate.middleware');
const { uploadPhoto } = require('../../middleware/upload.middleware');
const v = require('./clients.validators');

router.use(authenticate);

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.get('/:id/history', controller.getServiceHistory);
router.post('/', requireMinRole('RECEPTIONIST'), v.create, validate, controller.create);
router.put('/:id', requireMinRole('RECEPTIONIST'), v.update, validate, controller.update);
router.patch('/:id/toggle-active', requireMinRole('SUPERVISOR'), controller.toggleActive);
router.post('/:id/photos', requireMinRole('RECEPTIONIST'), uploadPhoto.array('photos', 5), controller.uploadPhotos);
router.delete('/:id/photos/:photoId', requireMinRole('SUPERVISOR'), controller.deletePhoto);

module.exports = router;
