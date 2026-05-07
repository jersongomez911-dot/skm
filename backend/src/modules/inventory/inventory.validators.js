const { body } = require('express-validator');

const create = [
  body('sku').trim().notEmpty().withMessage('SKU requerido.').isLength({ max: 100 }),
  body('name').trim().notEmpty().withMessage('Nombre requerido.').isLength({ max: 255 }),
  body('quantity').isFloat({ min: 0 }).withMessage('Cantidad inválida.').toFloat(),
  body('minStock').optional().isFloat({ min: 0 }).toFloat(),
  body('unitCost').optional().isFloat({ min: 0 }).toFloat(),
  body('salePrice').optional().isFloat({ min: 0 }).toFloat(),
  body('category').optional().isLength({ max: 100 }),
  body('brand').optional().isLength({ max: 100 }),
  body('supplierId').optional(),
];

const update = [
  body('name').optional().trim().notEmpty().isLength({ max: 255 }),
  body('minStock').optional().isFloat({ min: 0 }).toFloat(),
  body('unitCost').optional().isFloat({ min: 0 }).toFloat(),
  body('salePrice').optional().isFloat({ min: 0 }).toFloat(),
];

const stockMovement = [
  body('type').isIn(['ENTRY', 'EXIT', 'ADJUSTMENT']).withMessage('Tipo inválido.'),
  body('quantity').isFloat({ min: 0.01 }).withMessage('Cantidad inválida.').toFloat(),
  body('notes').optional().isLength({ max: 500 }),
  body('reference').optional().isLength({ max: 255 }),
  body('unitCost').optional().isFloat({ min: 0 }).toFloat(),
];

module.exports = { create, update, stockMovement };
