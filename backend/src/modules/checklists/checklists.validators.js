const { body } = require('express-validator');

const CATEGORIES = ['Motor', 'Suspensión', 'Frenos', 'Eléctrico', 'Chasis', 'Estética', 'General'];

const createTemplate = [
  body('name').trim().notEmpty().withMessage('Nombre requerido.'),
  body('motorcycleType').optional(),
  body('items').isArray({ min: 1 }).withMessage('Se requieren al menos un ítem.'),
  body('items.*.category').isIn(CATEGORIES).withMessage('Categoría inválida.'),
  body('items.*.label').trim().notEmpty().withMessage('Etiqueta requerida.'),
  body('items.*.isRequired').optional().isBoolean(),
];

const create = [
  body('templateId').optional(),
  body('items').optional().isArray(),
];

const updateItem = [
  body('status').isIn(['PENDING', 'OK', 'WARNING', 'FAIL', 'ISSUE', 'NA']).withMessage('Estado inválido.'),
  body('notes').optional().isLength({ max: 500 }),
];

module.exports = { createTemplate, create, updateItem };
