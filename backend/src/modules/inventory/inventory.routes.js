const express = require('express');
const router = express.Router();
const ctrl = require('./inventory.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireMinRole } = require('../../middleware/roles.middleware');
const { validate } = require('../../middleware/validate.middleware');
const v = require('./inventory.validators');

router.use(authenticate);

router.get('/', ctrl.getAll);
router.get('/low-stock', ctrl.getLowStock);
router.get('/movements', requireMinRole('SUPERVISOR'), ctrl.getMovements);
router.get('/:id', ctrl.getById);
router.get('/:id/movements', ctrl.getItemMovements);
router.post('/', requireMinRole('SUPERVISOR'), v.create, validate, ctrl.create);
router.put('/:id', requireMinRole('SUPERVISOR'), v.update, validate, ctrl.update);
router.patch('/:id/toggle-active', requireMinRole('ADMIN'), ctrl.toggleActive);
router.post('/:id/stock', requireMinRole('SUPERVISOR'), v.stockMovement, validate, ctrl.addStockMovement);

module.exports = router;
