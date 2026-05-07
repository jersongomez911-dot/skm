const express = require('express');
const router = express.Router();
const ctrl = require('./suppliers.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireMinRole } = require('../../middleware/roles.middleware');
const { validate } = require('../../middleware/validate.middleware');
const v = require('./suppliers.validators');

router.use(authenticate);
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', requireMinRole('SUPERVISOR'), v.create, validate, ctrl.create);
router.put('/:id', requireMinRole('SUPERVISOR'), v.update, validate, ctrl.update);
router.patch('/:id/toggle-active', requireMinRole('ADMIN'), ctrl.toggleActive);

module.exports = router;
