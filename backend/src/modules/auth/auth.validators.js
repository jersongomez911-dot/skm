const { body } = require('express-validator');

const login = [
  body('email').isEmail().withMessage('Email inválido.').normalizeEmail(),
  body('password').notEmpty().withMessage('Contraseña requerida.'),
];

const refresh = [
  body('refreshToken').notEmpty().withMessage('Refresh token requerido.'),
];

const forgotPassword = [
  body('email').isEmail().withMessage('Email inválido.').normalizeEmail(),
];

const resetPassword = [
  body('token').notEmpty().withMessage('Token requerido.'),
  body('password')
    .isLength({ min: 8 }).withMessage('Mínimo 8 caracteres.')
    .matches(/[A-Z]/).withMessage('Debe tener al menos una mayúscula.')
    .matches(/[0-9]/).withMessage('Debe tener al menos un número.'),
  body('confirmPassword').custom((val, { req }) => {
    if (val !== req.body.password) throw new Error('Las contraseñas no coinciden.');
    return true;
  }),
];

const changePassword = [
  body('currentPassword').notEmpty().withMessage('Contraseña actual requerida.'),
  body('newPassword')
    .isLength({ min: 8 }).withMessage('Mínimo 8 caracteres.')
    .matches(/[A-Z]/).withMessage('Debe tener al menos una mayúscula.')
    .matches(/[0-9]/).withMessage('Debe tener al menos un número.'),
];

const verify2FA = [
  body('token').isLength({ min: 6, max: 6 }).withMessage('Código TOTP de 6 dígitos requerido.').isNumeric(),
];

module.exports = { login, refresh, forgotPassword, resetPassword, changePassword, verify2FA };
