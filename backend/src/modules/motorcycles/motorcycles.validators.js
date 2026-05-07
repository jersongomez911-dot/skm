const { body } = require('express-validator');

const create = [
  body('clientId').notEmpty().withMessage('Cliente requerido.'),
  body('brand').trim().notEmpty().withMessage('Marca requerida.').isLength({ max: 100 }),
  body('model').trim().notEmpty().withMessage('Modelo requerido.').isLength({ max: 100 }),
  body('displacement').isInt({ min: 1, max: 3000 }).withMessage('Cilindraje inválido (1-3000 cc).'),
  body('year').isInt({ min: 1980, max: new Date().getFullYear() + 1 }).withMessage('Año inválido.'),
  body('vin').trim().notEmpty().withMessage('VIN requerido.').isLength({ max: 50 }),
  body('engineNumber').optional().isLength({ max: 50 }),
  body('hoursUsed').optional().isFloat({ min: 0 }).withMessage('Horas no pueden ser negativas.'),
  body('mileage').optional().isInt({ min: 0 }).withMessage('Kilometraje no puede ser negativo.'),
  body('color').optional().isLength({ max: 50 }),
];

const update = [
  body('brand').optional().trim().notEmpty().isLength({ max: 100 }),
  body('model').optional().trim().notEmpty().isLength({ max: 100 }),
  body('displacement').optional().isInt({ min: 1, max: 3000 }).withMessage('Cilindraje inválido.'),
  body('year').optional().isInt({ min: 1980, max: new Date().getFullYear() + 1 }).withMessage('Año inválido.'),
  body('hoursUsed').optional().isFloat({ min: 0 }).withMessage('Horas no pueden ser negativas.'),
  body('mileage').optional().isInt({ min: 0 }).withMessage('Kilometraje no puede ser negativo.'),
  body('status').optional().isIn(['ACTIVE', 'INACTIVE', 'IN_SERVICE', 'RETIRED']),
];

module.exports = { create, update };
