const express = require('express');
const router = express.Router();
const controller = require('./users.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireRole, requireMinRole } = require('../../middleware/roles.middleware');
const { validate } = require('../../middleware/validate.middleware');
const { uploadAvatar } = require('../../middleware/upload.middleware');
const v = require('./users.validators');

router.use(authenticate);

router.get('/', requireMinRole('SUPERVISOR'), controller.getAll);
router.get('/:id', requireMinRole('SUPERVISOR'), controller.getById);
router.post('/', requireRole('ADMIN'), v.create, validate, controller.create);
router.put('/:id', requireRole('ADMIN'), v.update, validate, controller.update);
router.patch('/:id/toggle-active', requireRole('ADMIN'), controller.toggleActive);
router.patch('/:id/role', requireRole('ADMIN'), v.updateRole, validate, controller.updateRole);
router.post('/:id/avatar', requireMinRole('RECEPTIONIST'), uploadAvatar.single('avatar'), controller.uploadAvatar);

module.exports = router;
