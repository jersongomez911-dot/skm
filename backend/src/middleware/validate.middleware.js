const { validationResult } = require('express-validator');
const xss = require('xss');

// Sanitize a value recursively
const sanitize = (value) => {
  if (typeof value === 'string') return xss(value.trim());
  if (Array.isArray(value)) return value.map(sanitize);
  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, sanitize(v)]));
  }
  return value;
};

// Validate and sanitize request
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Error de validación.',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  // Sanitize body
  if (req.body) req.body = sanitize(req.body);
  next();
};

module.exports = { validate, sanitize };
