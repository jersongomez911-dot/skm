const express = require('express');
const router = express.Router();
const ctrl = require('./reports.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireMinRole } = require('../../middleware/roles.middleware');

router.use(authenticate, requireMinRole('SUPERVISOR'));
router.get('/services', ctrl.servicesReport);
router.get('/revenue', ctrl.revenueReport);
router.get('/inventory', ctrl.inventoryReport);
router.get('/technicians', ctrl.techniciansReport);
router.get('/clients', ctrl.clientsReport);

module.exports = router;
