const express = require('express');
const router = express.Router();
const controller = require('./auth.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { authLimiter } = require('../../middleware/rateLimiter.middleware');
const { validate } = require('../../middleware/validate.middleware');
const v = require('./auth.validators');

router.post('/login', authLimiter, v.login, validate, controller.login);
router.post('/refresh', v.refresh, validate, controller.refresh);
router.post('/logout', authenticate, controller.logout);
router.post('/forgot-password', authLimiter, v.forgotPassword, validate, controller.forgotPassword);
router.post('/reset-password', v.resetPassword, validate, controller.resetPassword);
router.post('/change-password', authenticate, v.changePassword, validate, controller.changePassword);
router.post('/2fa/setup', authenticate, controller.setup2FA);
router.post('/2fa/verify', authenticate, v.verify2FA, validate, controller.verify2FA);
router.post('/2fa/disable', authenticate, v.verify2FA, validate, controller.disable2FA);
router.get('/me', authenticate, controller.getMe);

module.exports = router;
