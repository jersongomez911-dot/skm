const express = require('express');
const router = express.Router();
const controller = require('./motorcycles.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireMinRole } = require('../../middleware/roles.middleware');
const { validate } = require('../../middleware/validate.middleware');
const { uploadPhoto } = require('../../middleware/upload.middleware');
const v = require('./motorcycles.validators');

router.use(authenticate);

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.get('/:id/history', controller.getServiceHistory);
router.post('/', requireMinRole('RECEPTIONIST'), v.create, validate, controller.create);
router.put('/:id', requireMinRole('RECEPTIONIST'), v.update, validate, controller.update);
router.delete('/:id', requireMinRole('SUPERVISOR'), controller.remove);
router.post('/:id/photos', requireMinRole('RECEPTIONIST'), uploadPhoto.array('photos', 10), controller.uploadPhotos);
router.get('/:id/qr', controller.getQR);

module.exports = router;
