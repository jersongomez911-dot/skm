const { body } = require('express-validator');

const create = [
  body('name').trim().notEmpty().withMessage('Nombre requerido.').isLength({ max: 255 }),
  body('email').optional().isEmail().withMessage('Email inválido.'),
  body('phone').optional().isLength({ max: 20 }),
  body('address').optional().isLength({ max: 500 }),
  body('taxId').optional().isLength({ max: 50 }),
];
const update = [
  body('name').optional().trim().notEmpty().isLength({ max: 255 }),
  body('email').optional().isEmail().withMessage('Email inválido.'),
];

module.exports = { create, update };
