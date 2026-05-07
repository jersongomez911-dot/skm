const { body } = require('express-validator');

const VALID_STATUSES = ['PENDING', 'DIAGNOSIS', 'IN_PROGRESS', 'WAITING_PARTS', 'PAUSED', 'DONE', 'DELIVERED', 'CANCELLED'];
const VALID_PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'CRITICAL'];

const create = [
  body('motorcycleId').notEmpty().withMessage('Motocicleta requerida.'),
  body('priority').optional().isIn(VALID_PRIORITIES).withMessage('Prioridad inválida.'),
  body('slaHours').optional().isInt({ min: 1, max: 8760 }).withMessage('SLA inválido.').toInt(),
  body('estimatedHours').optional().isFloat({ min: 0 }).toFloat(),
  body('estimatedCost').optional().isFloat({ min: 0 }).toFloat(),
  body('observations').optional().isLength({ max: 5000 }),
  body('damageReport').optional().isLength({ max: 5000 }),
  body('accessories').optional().isLength({ max: 1000 }),
];

const update = [
  body('diagnosis').optional().isLength({ max: 5000 }),
  body('techNotes').optional().isLength({ max: 5000 }),
  body('laborCost').optional().isFloat({ min: 0 }).toFloat(),
  body('estimatedCost').optional().isFloat({ min: 0 }).toFloat(),
  body('estimatedHours').optional().isFloat({ min: 0 }).toFloat(),
  body('priority').optional().isIn(VALID_PRIORITIES),
  body('slaHours').optional().isInt({ min: 1 }).toInt(),
];

const updateStatus = [
  body('status').isIn(VALID_STATUSES).withMessage('Estado inválido.'),
  body('notes').optional().isLength({ max: 1000 }),
];

const assign = [
  body('technicianId').notEmpty().withMessage('Técnico requerido.'),
];

const addItem = [
  body('description').trim().notEmpty().withMessage('Descripción requerida.'),
  body('quantity').isFloat({ min: 0.01 }).withMessage('Cantidad inválida.').toFloat(),
  body('unitCost').isFloat({ min: 0 }).withMessage('Costo inválido.').toFloat(),
  body('inventoryItemId').optional(),
];

module.exports = { create, update, updateStatus, assign, addItem };
