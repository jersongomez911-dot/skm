import api from './client'

const qs = (params) => new URLSearchParams(params).toString()

export const clientsApi = {
  getAll: (params) => api.get(`/clients?${qs(params)}`),
  getById: (id) => api.get(`/clients/${id}`),
  getHistory: (id, params) => api.get(`/clients/${id}/history?${qs(params)}`),
  create: (data) => api.post('/clients', data),
  update: (id, data) => api.put(`/clients/${id}`, data),
  toggleActive: (id) => api.patch(`/clients/${id}/toggle-active`),
  uploadPhotos: (id, files) => {
    const fd = new FormData()
    files.forEach(f => fd.append('photos', f))
    return api.post(`/clients/${id}/photos`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  deletePhoto: (id, photoId) => api.delete(`/clients/${id}/photos/${photoId}`),
}

export const motorcyclesApi = {
  getAll: (params) => api.get(`/motorcycles?${qs(params)}`),
  getById: (id) => api.get(`/motorcycles/${id}`),
  getHistory: (id, params) => api.get(`/motorcycles/${id}/history?${qs(params)}`),
  getQR: (id) => api.get(`/motorcycles/${id}/qr`),
  create: (data) => api.post('/motorcycles', data),
  update: (id, data) => api.put(`/motorcycles/${id}`, data),
  delete: (id) => api.delete(`/motorcycles/${id}`),
  uploadPhotos: (id, files) => {
    const fd = new FormData()
    files.forEach(f => fd.append('photos', f))
    return api.post(`/motorcycles/${id}/photos`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
}

export const servicesApi = {
  getAll: (params) => api.get(`/services?${qs(params)}`),
  getById: (id) => api.get(`/services/${id}`),
  getStats: () => api.get('/services/stats'),
  getQR: (id) => api.get(`/services/${id}/qr`),
  create: (data) => api.post('/services', data),
  update: (id, data) => api.put(`/services/${id}`, data),
  updateStatus: (id, data) => api.patch(`/services/${id}/status`, data),
  assign: (id, technicianId) => api.patch(`/services/${id}/assign`, { technicianId }),
  addItem: (id, data) => api.post(`/services/${id}/items`, data),
  removeItem: (id, itemId) => api.delete(`/services/${id}/items/${itemId}`),
  uploadPhotos: (id, files) => {
    const fd = new FormData()
    files.forEach(f => fd.append('photos', f))
    return api.post(`/services/${id}/photos`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  uploadSignature: (id, file) => {
    const fd = new FormData(); fd.append('signature', file)
    return api.post(`/services/${id}/signature`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
}

export const checklistsApi = {
  getTemplates: () => api.get('/checklists/templates'),
  getTemplate: (id) => api.get(`/checklists/templates/${id}`),
  createTemplate: (data) => api.post('/checklists/templates', data),
  updateTemplate: (id, data) => api.put(`/checklists/templates/${id}`, data),
  deleteTemplate: (id) => api.delete(`/checklists/templates/${id}`),
  getByService: (serviceId) => api.get(`/checklists/service/${serviceId}`),
  create: (serviceId, data) => api.post(`/checklists/service/${serviceId}`, data),
  updateItem: (id, itemId, data) => api.patch(`/checklists/${id}/items/${itemId}`, data),
  complete: (id) => api.patch(`/checklists/${id}/complete`),
}

export const inventoryApi = {
  getAll: (params) => api.get(`/inventory?${qs(params)}`),
  getLowStock: () => api.get('/inventory/low-stock'),
  getById: (id) => api.get(`/inventory/${id}`),
  getMovements: (params) => api.get(`/inventory/movements?${qs(params)}`),
  getItemMovements: (id, params) => api.get(`/inventory/${id}/movements?${qs(params)}`),
  create: (data) => api.post('/inventory', data),
  update: (id, data) => api.put(`/inventory/${id}`, data),
  toggleActive: (id) => api.patch(`/inventory/${id}/toggle-active`),
  addMovement: (id, data) => api.post(`/inventory/${id}/stock`, data),
}

export const suppliersApi = {
  getAll: (params) => api.get(`/suppliers?${qs(params)}`),
  getById: (id) => api.get(`/suppliers/${id}`),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  toggleActive: (id) => api.patch(`/suppliers/${id}/toggle-active`),
}

export const usersApi = {
  getAll: (params) => api.get(`/users?${qs(params)}`),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  toggleActive: (id) => api.patch(`/users/${id}/toggle-active`),
  updateRole: (id, role) => api.patch(`/users/${id}/role`, { role }),
}

export const dashboardApi = {
  getKpis: () => api.get('/dashboard/kpis'),
  getCharts: () => api.get('/dashboard/charts'),
  getAlerts: () => api.get('/dashboard/alerts'),
  getRecentServices: () => api.get('/dashboard/recent-services'),
  getTopTechnicians: () => api.get('/dashboard/top-technicians'),
}

export const reportsApi = {
  services: (params) => api.get(`/reports/services?${qs(params)}`, { responseType: ['pdf', 'xlsx'].includes(params.format) ? 'blob' : 'json' }),
  revenue: (params) => api.get(`/reports/revenue?${qs(params)}`, { responseType: ['pdf', 'xlsx'].includes(params.format) ? 'blob' : 'json' }),
  inventory: (params) => api.get(`/reports/inventory?${qs(params)}`, { responseType: ['pdf', 'xlsx'].includes(params.format) ? 'blob' : 'json' }),
  technicians: (params) => api.get(`/reports/technicians?${qs(params)}`),
  clients: (params) => api.get(`/reports/clients?${qs(params)}`, { responseType: ['pdf', 'xlsx'].includes(params.format) ? 'blob' : 'json' }),
}

export const auditApi = {
  getAll: (params) => api.get(`/audit?${qs(params)}`),
  getStats: () => api.get('/audit/stats'),
}

export const notificationsApi = {
  getAll: (params) => api.get(`/notifications?${qs(params)}`),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
  remove: (id) => api.delete(`/notifications/${id}`),
}
