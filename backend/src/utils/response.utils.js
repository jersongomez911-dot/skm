const success = (res, data, message = 'OK', statusCode = 200) => res.status(statusCode).json({ success: true, message, data })
const created = (res, data, message = 'Creado exitosamente') => success(res, data, message, 201)
const paginated = (res, data, meta, message = 'OK') => res.status(200).json({ success: true, message, data, meta })
const buildPaginationMeta = (total, page, limit) => ({
  total: Number(total),
  page: Number(page),
  limit: Number(limit),
  totalPages: Math.ceil(total / limit),
  hasNext: page * limit < total,
  hasPrev: page > 1,
})

module.exports = { success, created, paginated, buildPaginationMeta }
