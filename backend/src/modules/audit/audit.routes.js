const express = require('express');
const router = express.Router();
const ctrl = require('./audit.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireMinRole } = require('../../middleware/roles.middleware');

router.use(authenticate, requireMinRole('SUPERVISOR'));
router.get('/', ctrl.getAll);
router.get('/stats', ctrl.getStats);

module.exports = router;
