const { body } = require('express-validator');

const create = [
  body('name').trim().notEmpty().withMessage('Nombre requerido.').isLength({ max: 255 }),
  body('email').isEmail().withMessage('Email inválido.').normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Mínimo 8 caracteres.')
    .matches(/[A-Z]/).withMessage('Debe tener al menos una mayúscula.')
    .matches(/[0-9]/).withMessage('Debe tener al menos un número.'),
  body('role').isIn(['ADMIN', 'SUPERVISOR', 'MECHANIC', 'RECEPTIONIST', 'VIEWER']).withMessage('Rol inválido.'),
  body('phone').optional().isMobilePhone('es-CO').withMessage('Teléfono inválido.'),
];

const update = [
  body('name').optional().trim().notEmpty().withMessage('Nombre requerido.').isLength({ max: 255 }),
  body('email').optional().isEmail().withMessage('Email inválido.').normalizeEmail(),
  body('phone').optional().isMobilePhone('es-CO').withMessage('Teléfono inválido.'),
];

const updateRole = [
  body('role').isIn(['ADMIN', 'SUPERVISOR', 'MECHANIC', 'RECEPTIONIST', 'VIEWER']).withMessage('Rol inválido.'),
];

module.exports = { create, update, updateRole };
