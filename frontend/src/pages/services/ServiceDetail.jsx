import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Edit, Bike, User, ChevronDown, Plus, Trash2, QrCode,
  ClipboardList, Camera, CheckCircle2, AlertCircle, XCircle, Info, Image as ImageIcon,
  Package
} from 'lucide-react'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { servicesApi, usersApi, inventoryApi, checklistsApi } from '../../api/index'
import Modal from '../../components/ui/Modal'
import { useAuthStore } from '../../store/authStore'
import { useDebounce } from '../../hooks/useDebounce'
import { Search, Loader2 } from 'lucide-react'

const STATUS_LABELS = { PENDING: 'Pendiente', DIAGNOSIS: 'Diagnóstico', IN_PROGRESS: 'En Proceso', WAITING_PARTS: 'Esp. Repuestos', PAUSED: 'Pausado', DONE: 'Terminado', DELIVERED: 'Entregado', CANCELLED: 'Cancelado' }
const STATUS_FLOW = { PENDING: ['DIAGNOSIS', 'CANCELLED'], DIAGNOSIS: ['IN_PROGRESS', 'WAITING_PARTS', 'CANCELLED', 'PENDING'], IN_PROGRESS: ['WAITING_PARTS', 'PAUSED', 'DONE', 'CANCELLED'], WAITING_PARTS: ['IN_PROGRESS', 'PAUSED', 'CANCELLED'], PAUSED: ['IN_PROGRESS', 'CANCELLED'], DONE: ['DELIVERED', 'IN_PROGRESS'], DELIVERED: [], CANCELLED: [] }
const PRIORITY_BADGE = { LOW: 'badge-gray', NORMAL: 'badge-blue', HIGH: 'badge-yellow', CRITICAL: 'badge-red' }
const STATUS_BADGE = { PENDING: 'badge-yellow', DIAGNOSIS: 'badge-blue', IN_PROGRESS: 'badge-blue', WAITING_PARTS: 'badge-orange', PAUSED: 'badge-gray', DONE: 'badge-green', DELIVERED: 'badge-green', CANCELLED: 'badge-red' }
const fmtCOP = n => n ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n) : '$0'

export default function ServiceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { hasMinRole, user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('info')

  // Modals
  const [statusModal, setStatusModal] = useState(false)
  const [itemModal, setItemModal] = useState(false)
  const [qrOpen, setQrOpen] = useState(false)
  const [checklistModal, setChecklistModal] = useState(false)
  const [laborModal, setLaborModal] = useState(false)

  // Form states
  const [newStatus, setNewStatus] = useState('')
  const [statusNotes, setStatusNotes] = useState('')
  const [newItem, setNewItem] = useState({ description: '', quantity: 1, unitCost: 0, inventoryItemId: '' })
  const [invSearch, setInvSearch] = useState('')
  const debouncedSearch = useDebounce(invSearch, 400)
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [tempLabor, setTempLabor] = useState(0)

  // Queries
  const { data: service, isLoading } = useQuery({
    queryKey: ['service', id],
    queryFn: () => servicesApi.getById(id).then(r => r.data.data),
    refetchInterval: 10000,
  })

  const { data: technicians } = useQuery({
    queryKey: ['users-mechanics'],
    queryFn: () => usersApi.getAll({ role: 'MECHANIC', isActive: 'true' }).then(r => r.data.data),
  })

  const { data: invItems, isFetching: isInvFetching } = useQuery({
    queryKey: ['inventory-search', debouncedSearch],
    queryFn: () => inventoryApi.getAll({ search: debouncedSearch, isActive: 'true', limit: 10 }).then(r => r.data.data),
    enabled: debouncedSearch.length > 1,
  })

  const { data: templates } = useQuery({
    queryKey: ['checklist-templates'],
    queryFn: () => checklistsApi.getTemplates().then(r => r.data.data),
  })

  // Mutations
  const statusMutation = useMutation({
    mutationFn: () => servicesApi.updateStatus(id, { status: newStatus, notes: statusNotes }),
    onSuccess: () => { toast.success('Estado actualizado.'); qc.invalidateQueries(['service', id]); setStatusModal(false) },
    onError: (err) => toast.error(err.response?.data?.message || 'Error al actualizar estado'),
  })

  const updateLaborMutation = useMutation({
    mutationFn: (value) => servicesApi.update(id, { laborCost: Number(value) }),
    onSuccess: () => { toast.success('Mano de obra actualizada.'); qc.invalidateQueries(['service', id]); setLaborModal(false) },
    onError: (err) => toast.error(err.response?.data?.message || 'Error al actualizar costos'),
  })

  const assignMutation = useMutation({
    mutationFn: (techId) => servicesApi.assign(id, techId),
    onSuccess: () => { toast.success('Técnico asignado.'); qc.invalidateQueries(['service', id]) },
  })

  const addItemMutation = useMutation({
    mutationFn: () => servicesApi.addItem(id, { ...newItem, quantity: Number(newItem.quantity), unitCost: Number(newItem.unitCost) }),
    onSuccess: () => { toast.success('Ítem agregado.'); qc.invalidateQueries(['service', id]); setItemModal(false); setNewItem({ description: '', quantity: 1, unitCost: 0, inventoryItemId: '' }); setInvSearch('') },
  })

  const removeItemMutation = useMutation({
    mutationFn: (itemId) => servicesApi.removeItem(id, itemId),
    onSuccess: () => { toast.success('Ítem eliminado.'); qc.invalidateQueries(['service', id]) },
  })

  const createChecklistMutation = useMutation({
    mutationFn: () => checklistsApi.create(id, { templateId: selectedTemplate }),
    onSuccess: () => { toast.success('Checklist iniciado.'); qc.invalidateQueries(['service', id]); setChecklistModal(false) },
  })

  const completeChecklistMutation = useMutation({
    mutationFn: () => checklistsApi.complete(currentChecklist?.id),
    onSuccess: () => { toast.success('Checklist finalizado.'); qc.invalidateQueries(['service', id]) },
    onError: (err) => toast.error(err.response?.data?.message || 'Error al finalizar checklist'),
  })

  const updateChecklistItemMutation = useMutation({
    mutationFn: ({ clId, itemId, data }) => checklistsApi.updateItem(clId, itemId, data),
    onSuccess: () => qc.invalidateQueries(['service', id]),
  })

  const uploadPhotoMutation = useMutation({
    mutationFn: (files) => servicesApi.uploadPhotos(id, files),
    onSuccess: () => { toast.success('Fotos subidas.'); qc.invalidateQueries(['service', id]) },
  })

  if (isLoading) return <div className="h-64 card animate-pulse" />
  if (!service) return <p className="text-dark-400">Servicio no encontrado.</p>

  const allowedTransitions = STATUS_FLOW[service.status] || []
  const currentChecklist = service.checklists?.[0]

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-4">
        <button onClick={() => navigate(-1)} className="btn-ghost btn-icon"><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex-1">
          <h1 className="page-title">Servicio <span className="text-brand-400">#{id.slice(-6).toUpperCase()}</span></h1>
          <p className="page-subtitle">{service.motorcycle?.brand} {service.motorcycle?.model} — {service.motorcycle?.client?.fullName}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setQrOpen(true)} className="btn-secondary btn-sm gap-2"><QrCode className="w-4 h-4" />QR</button>
          {hasMinRole('RECEPTIONIST') && <button onClick={() => navigate(`/services/${id}/edit`)} className="btn-secondary btn-sm gap-2"><Edit className="w-4 h-4" />Editar</button>}
          {allowedTransitions.length > 0 && hasMinRole('MECHANIC') && (
            <button onClick={() => setStatusModal(true)} className="btn-primary btn-sm gap-2">
              <ChevronDown className="w-4 h-4" />Estado
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-dark-800 rounded-lg border border-dark-700/60 w-fit">
        {[
          { id: 'info', label: 'Información', icon: Info },
          { id: 'items', label: 'Repuestos', icon: Package },
          { id: 'checklist', label: 'Checklist', icon: ClipboardList },
          { id: 'photos', label: 'Fotos', icon: ImageIcon },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === tab.id ? 'bg-dark-700 text-brand-400 shadow-sm' : 'text-dark-400 hover:text-gray-200'}`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Summary */}
        <div className="space-y-6">
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className={`${STATUS_BADGE[service.status] || 'badge-gray'} text-base px-3 py-1`}>{STATUS_LABELS[service.status]}</span>
              <span className={PRIORITY_BADGE[service.priority] || 'badge-gray'}>{service.priority}</span>
            </div>
            <div className="space-y-3 text-sm">
              {[
                ['Técnico', service.technician?.name || 'Sin asignar'],
                ['Recepcionista', service.receptionist?.name],
                ['Creado', service.createdAt ? format(new Date(service.createdAt), 'dd/MM/yyyy HH:mm') : '-'],
                ['SLA', service.slaHours ? `${service.slaHours}h` : '-'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-dark-400">{k}</span>
                  <span className="text-white font-medium truncate ml-2">{v || '-'}</span>
                </div>
              ))}
            </div>
            {hasMinRole('SUPERVISOR') && (
              <div className="pt-2">
                <label className="label text-xs">Asignar técnico</label>
                <select onChange={e => e.target.value && assignMutation.mutate(e.target.value)} className="input text-sm" defaultValue={service.technicianId || ""}>
                  <option value="">Seleccionar técnico</option>
                  {technicians?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            )}
          </div>

          <div className="card p-5 space-y-4">
            <h4 className="font-semibold text-white">Vehículo</h4>
            <div className="flex items-center gap-3 p-3 bg-dark-700/40 rounded-lg">
              <div className="p-2 bg-brand-500/20 rounded-lg"><Bike className="w-5 h-5 text-brand-400" /></div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">{service.motorcycle?.brand} {service.motorcycle?.model}</p>
                <p className="text-xs text-dark-400 truncate">VIN: {service.motorcycle?.vin}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-dark-700/40 rounded-lg">
              <div className="p-2 bg-blue-500/20 rounded-lg"><User className="w-5 h-5 text-blue-400" /></div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">{service.motorcycle?.client?.fullName}</p>
                <p className="text-xs text-dark-400 truncate">{service.motorcycle?.client?.phone}</p>
              </div>
            </div>
          </div>

          <div className="card p-5 space-y-3">
            <h4 className="font-semibold text-white">Costos</h4>
            {[
              ['Mano de obra', service.laborCost], ['Repuestos', service.partsCost], ['Total', service.totalCost],
            ].map(([k, v]) => (
              <div key={k} className={`flex justify-between items-center ${k === 'Total' ? 'border-t border-dark-700 mt-2 pt-2 font-bold text-brand-400 text-lg' : 'text-sm text-dark-400'}`}>
                <div className="flex items-center gap-2">
                  <span>{k}</span>
                  {k === 'Mano de obra' && hasMinRole('MECHANIC') && !['DELIVERED', 'CANCELLED'].includes(service.status) && (
                    <button 
                      onClick={() => { setTempLabor(service.laborCost); setLaborModal(true) }} 
                      className="p-1 text-dark-500 hover:text-brand-400 transition-colors"
                    >
                      <Edit className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <span className={k === 'Total' ? '' : 'text-white'}>{fmtCOP(v)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Tab Content */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'info' && (
            <div className="space-y-4">
              {[['Informe de daños', service.damageReport], ['Diagnóstico', service.diagnosis], ['Notas técnicas', service.techNotes], ['Observaciones', service.observations]].map(([title, content]) => (
                <div key={title} className="card p-5">
                  <h4 className="text-xs font-bold text-dark-400 uppercase tracking-wider mb-3">{title}</h4>
                  <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{content || 'Sin información registrada.'}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'items' && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h4 className="text-lg font-bold text-white">Repuestos y Materiales</h4>
                  <p className="text-sm text-dark-400">Gestión de partes utilizadas en este servicio</p>
                </div>
                {hasMinRole('MECHANIC') && !['DELIVERED', 'CANCELLED'].includes(service.status) && (
                  <button onClick={() => setItemModal(true)} className="btn-primary gap-2"><Plus className="w-4 h-4" />Agregar</button>
                )}
              </div>
              <div className="space-y-3">
                {service.items?.map(item => (
                  <div key={item.id} className="flex items-center gap-4 p-4 bg-dark-700/30 border border-dark-700/60 rounded-xl hover:border-dark-600 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-dark-700 flex items-center justify-center text-dark-400"><Package className="w-5 h-5" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">{item.description}</p>
                      {item.inventoryItem && <p className="text-xs text-brand-400">SKU: {item.inventoryItem.sku}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">{fmtCOP(item.totalCost)}</p>
                      <p className="text-xs text-dark-400">{item.quantity} x {fmtCOP(item.unitCost)}</p>
                    </div>
                    {hasMinRole('MECHANIC') && !['DELIVERED', 'CANCELLED'].includes(service.status) && (
                      <button onClick={() => removeItemMutation.mutate(item.id)} className="p-2 text-dark-500 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    )}
                  </div>
                ))}
                {!service.items?.length && (
                  <div className="text-center py-12 border-2 border-dashed border-dark-700 rounded-xl">
                    <Package className="w-12 h-12 text-dark-600 mx-auto mb-3" />
                    <p className="text-dark-400">No hay repuestos registrados aún.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'checklist' && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h4 className="text-lg font-bold text-white">Inspección (Checklist)</h4>
                  <p className="text-sm text-dark-400">Control de calidad y estado del vehículo</p>
                </div>
                {!currentChecklist && hasMinRole('MECHANIC') && (
                  <button onClick={() => setChecklistModal(true)} className="btn-primary gap-2"><Plus className="w-4 h-4" />Iniciar Checklist</button>
                )}
              </div>

              {currentChecklist ? (
                <div className="space-y-8">
                  {/* Checklist header info */}
                  <div className="flex items-center justify-between p-4 bg-brand-500/5 rounded-xl border border-brand-500/20">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${currentChecklist.completedAt ? 'bg-emerald-500/20 text-emerald-500' : 'bg-brand-500/20 text-brand-500'}`}>
                        {currentChecklist.completedAt ? <CheckCircle2 className="w-5 h-5" /> : <ClipboardList className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{currentChecklist.completedAt ? 'Checklist Finalizado' : 'Checklist en curso'}</p>
                        <p className="text-xs text-dark-400">{currentChecklist.template?.name || 'Inspección General'}</p>
                      </div>
                    </div>
                    {!currentChecklist.completedAt && (
                      <button 
                        onClick={() => completeChecklistMutation.mutate()} 
                        disabled={completeChecklistMutation.isPending}
                        className="btn-primary btn-sm"
                      >
                        Finalizar Checklist
                      </button>
                    )}
                  </div>

                  {/* Checklist stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-dark-700/40 p-3 rounded-lg text-center">
                      <p className="text-xs text-dark-400 mb-1">Total</p>
                      <p className="text-lg font-bold text-white">{currentChecklist.items.length}</p>
                    </div>
                    <div className="bg-emerald-500/10 p-3 rounded-lg text-center">
                      <p className="text-xs text-emerald-400 mb-1">OK</p>
                      <p className="text-lg font-bold text-emerald-500">{currentChecklist.items.filter(i => i.status === 'OK').length}</p>
                    </div>
                    <div className="bg-red-500/10 p-3 rounded-lg text-center">
                      <p className="text-xs text-red-400 mb-1">Fallas</p>
                      <p className="text-lg font-bold text-red-500">{currentChecklist.items.filter(i => i.status === 'FAIL').length}</p>
                    </div>
                  </div>

                  {/* Checklist items by category */}
                  <div className="space-y-6">
                    {Object.entries(currentChecklist.items.reduce((acc, item) => {
                      acc[item.category] = acc[item.category] || []; acc[item.category].push(item); return acc;
                    }, {})).map(([cat, items]) => (
                      <div key={cat} className="space-y-3">
                        <h5 className="text-xs font-bold text-dark-400 uppercase tracking-widest pl-1">{cat}</h5>
                        <div className="space-y-2">
                          {items.map(item => (
                            <div key={item.id} className="flex items-center gap-3 p-3 bg-dark-700/20 rounded-lg hover:bg-dark-700/40 transition-colors border border-transparent hover:border-dark-700">
                              <span className="flex-1 text-sm text-gray-200">{item.label} {item.isRequired && <span className="text-red-500">*</span>}</span>
                              <div className="flex gap-1">
                                {[
                                  { val: 'OK', icon: CheckCircle2, color: 'text-emerald-500', bg: 'hover:bg-emerald-500/20' },
                                  { val: 'WARNING', icon: AlertCircle, color: 'text-yellow-500', bg: 'hover:bg-yellow-500/20' },
                                  { val: 'FAIL', icon: XCircle, color: 'text-red-500', bg: 'hover:bg-red-500/20' },
                                ].map(opt => (
                                  <button
                                    key={opt.val}
                                    onClick={() => updateChecklistItemMutation.mutate({ clId: currentChecklist.id, itemId: item.id, data: { status: opt.val } })}
                                    className={`p-1.5 rounded-md transition-all ${item.status === opt.val ? opt.bg + ' ' + opt.color : 'text-dark-600 hover:text-dark-400'}`}
                                  >
                                    <opt.icon className="w-5 h-5" />
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-dark-700/20 border-2 border-dashed border-dark-700 rounded-xl">
                  <ClipboardList className="w-12 h-12 text-dark-600 mx-auto mb-3" />
                  <p className="text-dark-400 max-w-xs mx-auto">No se ha iniciado un checklist de inspección para este servicio.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'photos' && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h4 className="text-lg font-bold text-white">Galería de Fotos</h4>
                  <p className="text-sm text-dark-400">Evidencia visual del servicio y estado del vehículo</p>
                </div>
                <label className="btn-primary gap-2 cursor-pointer">
                  <Camera className="w-4 h-4" />Subir Fotos
                  <input type="file" multiple accept="image/*" className="hidden" onChange={e => e.target.files?.length && uploadPhotoMutation.mutate(Array.from(e.target.files))} />
                </label>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {service.photos?.map(photo => (
                  <div key={photo.id} className="group relative aspect-square rounded-xl overflow-hidden bg-dark-700 border border-dark-600">
                    <img src={`${import.meta.env.VITE_API_URL.replace('/api/v1', '')}${photo.url}`} alt="Service" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <p className="text-xs text-white font-medium">{format(new Date(photo.createdAt), 'dd/MM/yyyy')}</p>
                    </div>
                  </div>
                ))}
                {!service.photos?.length && (
                  <div className="col-span-full text-center py-12">
                    <ImageIcon className="w-12 h-12 text-dark-600 mx-auto mb-3" />
                    <p className="text-dark-400">No hay fotos cargadas.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Modal */}
      <Modal open={statusModal} onClose={() => setStatusModal(false)} title="Cambiar Estado" size="sm">
        <div className="space-y-4">
          <div>
            <label className="label">Nuevo estado</label>
            <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="input">
              <option value="">Seleccionar estado</option>
              {allowedTransitions.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Notas del cambio</label>
            <textarea value={statusNotes} onChange={e => setStatusNotes(e.target.value)} rows={3} className="input" placeholder="Ej: Esperando repuestos del proveedor X..." />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setStatusModal(false)} className="btn-secondary">Cancelar</button>
            <button disabled={!newStatus || statusMutation.isPending} onClick={() => statusMutation.mutate()} className="btn-primary min-w-[100px]">
              {statusMutation.isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : 'Actualizar'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Item Modal with Inventory Search */}
      <Modal open={itemModal} onClose={() => setItemModal(false)} title="Agregar Repuesto" size="md">
        <div className="space-y-5">
          <div className="space-y-3">
            <label className="label">Buscar en Inventario (opcional)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-dark-400">
                <Search className="w-4 h-4" />
              </div>
              <input 
                type="text" 
                className="input pl-10 pr-10" 
                placeholder="Escribe nombre, marca o SKU..." 
                value={invSearch} 
                onChange={e => setInvSearch(e.target.value)} 
              />
              {isInvFetching && (
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                  <Loader2 className="w-4 h-4 text-brand-400 animate-spin" />
                </div>
              )}

              <AnimatePresence>
                {invSearch.length > 1 && (invItems || isInvFetching) && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute z-50 left-0 right-0 mt-2 bg-dark-800 rounded-xl border border-dark-600 shadow-2xl overflow-hidden max-h-60 overflow-y-auto divide-y divide-dark-700/50 backdrop-blur-md"
                  >
                    {isInvFetching && !invItems && (
                      <div className="p-8 text-center text-dark-400">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-400" />
                        <p className="text-xs">Buscando en almacén...</p>
                      </div>
                    )}
                    
                    {invItems?.length > 0 ? (
                      invItems.map(item => (
                        <button 
                          key={item.id} 
                          onClick={() => {
                            setNewItem({ description: item.name, quantity: 1, unitCost: item.salePrice || item.unitCost, inventoryItemId: item.id })
                            setInvSearch('')
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-brand-500/10 flex justify-between items-center group transition-colors"
                        >
                          <div className="min-w-0 flex-1 pr-4">
                            <p className="text-sm font-bold text-white group-hover:text-brand-400 transition-colors truncate">{item.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] bg-dark-700 px-1.5 py-0.5 rounded text-dark-400 uppercase font-mono">{item.sku}</span>
                              <span className="text-[10px] text-dark-500">{item.brand} • Stock: <span className={item.quantity <= (item.minStock || 0) ? 'text-red-400' : 'text-emerald-400'}>{item.quantity}</span></span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-bold text-white">{fmtCOP(item.salePrice || item.unitCost)}</span>
                            {item.category && <p className="text-[10px] text-dark-500">{item.category}</p>}
                          </div>
                        </button>
                      ))
                    ) : !isInvFetching && invSearch.length > 1 && (
                      <div className="p-8 text-center text-dark-400">
                        <p className="text-sm">No se encontraron repuestos.</p>
                        <p className="text-xs mt-1">Intenta con otro término o SKU.</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="border-t border-dark-700 pt-5 space-y-4">
            <div>
              <label className="label">Descripción *</label>
              <input type="text" value={newItem.description} onChange={e => setNewItem(p => ({...p, description: e.target.value}))} className="input" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Cantidad *</label>
                <input type="number" min="1" value={newItem.quantity} onChange={e => setNewItem(p => ({...p, quantity: e.target.value}))} className="input" />
              </div>
              <div>
                <label className="label">Precio Unitario *</label>
                <input type="number" value={newItem.unitCost} onChange={e => setNewItem(p => ({...p, unitCost: e.target.value}))} className="input" />
              </div>
            </div>
            <div className="p-3 bg-dark-700/30 rounded-lg flex justify-between items-center">
              <span className="text-sm text-dark-400">Total calculado</span>
              <span className="text-lg font-bold text-white">{fmtCOP(newItem.quantity * newItem.unitCost)}</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setItemModal(false)} className="btn-secondary">Cancelar</button>
            <button disabled={!newItem.description || addItemMutation.isPending} onClick={() => addItemMutation.mutate()} className="btn-primary min-w-[120px]">
              {addItemMutation.isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : 'Agregar Ítem'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Labor Cost Modal */}
      <Modal open={laborModal} onClose={() => setLaborModal(false)} title="Actualizar Mano de Obra" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-dark-400">Ingresa el costo total de la mano de obra para este servicio.</p>
          <div>
            <label className="label">Costo (COP)</label>
            <input 
              type="number" 
              className="input" 
              value={tempLabor} 
              onChange={e => setTempLabor(e.target.value)} 
              placeholder="0"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setLaborModal(false)} className="btn-secondary">Cancelar</button>
            <button 
              disabled={updateLaborMutation.isPending} 
              onClick={() => updateLaborMutation.mutate(tempLabor)} 
              className="btn-primary min-w-[100px]"
            >
              {updateLaborMutation.isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : 'Guardar'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Checklist Start Modal */}
      <Modal open={checklistModal} onClose={() => setChecklistModal(false)} title="Vincular Inspección" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-dark-400">Selecciona una plantilla para iniciar la revisión técnica de este servicio.</p>
          <div>
            <label className="label">Plantilla *</label>
            <select value={selectedTemplate} onChange={e => setSelectedTemplate(e.target.value)} className="input">
              <option value="">Seleccionar plantilla...</option>
              {templates?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setChecklistModal(false)} className="btn-secondary">Cancelar</button>
            <button disabled={!selectedTemplate || createChecklistMutation.isPending} onClick={() => createChecklistMutation.mutate()} className="btn-primary">
              Iniciar
            </button>
          </div>
        </div>
      </Modal>

      {/* QR Modal */}
      <Modal open={qrOpen} onClose={() => setQrOpen(false)} title={`Código QR de Servicio`} size="sm">
        {service.qrCode && (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="p-4 bg-white rounded-2xl shadow-xl">
              <img src={service.qrCode} alt="QR" className="w-48 h-48" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-white">Servicio #{id.slice(-6).toUpperCase()}</p>
              <p className="text-xs text-dark-400">{service.motorcycle?.brand} {service.motorcycle?.model}</p>
            </div>
            <button onClick={() => window.print()} className="btn-secondary btn-sm mt-2">Imprimir Ticket</button>
          </div>
        )}
      </Modal>
    </div>
  )
}
