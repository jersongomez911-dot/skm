const { body } = require('express-validator');

const create = [
  body('fullName').trim().notEmpty().withMessage('Nombre completo requerido.').isLength({ max: 255 }),
  body('documentNumber').trim().notEmpty().withMessage('Número de documento requerido.').isLength({ max: 50 }),
  body('phone').trim().notEmpty().withMessage('Teléfono requerido.').isLength({ max: 20 }),
  body('email').isEmail().withMessage('Email inválido.').normalizeEmail(),
  body('address').optional().isLength({ max: 500 }),
  body('city').optional().isLength({ max: 100 }),
  body('birthDate').notEmpty().withMessage('Fecha de nacimiento requerida.').isISO8601().withMessage('Fecha inválida.'),
  body('category').optional().isLength({ max: 100 }),
  body('team').optional().isLength({ max: 100 }),
  body('emergencyContact').optional().isLength({ max: 255 }),
  body('observations').optional().isLength({ max: 5000 }),
];

const update = [
  body('fullName').optional().trim().notEmpty().isLength({ max: 255 }),
  body('phone').optional().trim().notEmpty().isLength({ max: 20 }),
  body('email').optional().isEmail().withMessage('Email inválido.').normalizeEmail(),
  body('address').optional().isLength({ max: 500 }),
  body('city').optional().isLength({ max: 100 }),
  body('birthDate').optional({ checkFalsy: true }).isISO8601().withMessage('Fecha inválida.'),
];

module.exports = { create, update };
