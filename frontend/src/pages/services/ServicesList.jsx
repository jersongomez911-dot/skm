import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, Eye, Edit, Wrench, Filter } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { servicesApi } from '../../api/index'
import DataTable from '../../components/ui/DataTable'
import { useAuthStore } from '../../store/authStore'
import { useDebounce } from '../../hooks/useDebounce'
import { format } from 'date-fns'

const STATUS_OPTIONS = ['PENDING','DIAGNOSIS','IN_PROGRESS','WAITING_PARTS','PAUSED','DONE','DELIVERED','CANCELLED']
const STATUS_LABELS = { PENDING:'Pendiente',DIAGNOSIS:'Diagnóstico',IN_PROGRESS:'En Proceso',WAITING_PARTS:'Esp. Repuestos',PAUSED:'Pausado',DONE:'Terminado',DELIVERED:'Entregado',CANCELLED:'Cancelado' }
const STATUS_BADGE = { PENDING:'badge-yellow',DIAGNOSIS:'badge-blue',IN_PROGRESS:'badge-blue',WAITING_PARTS:'badge-orange',PAUSED:'badge-gray',DONE:'badge-green',DELIVERED:'badge-green',CANCELLED:'badge-red' }
const PRIORITY_BADGE = { LOW:'badge-gray',NORMAL:'badge-blue',HIGH:'badge-yellow',CRITICAL:'badge-red' }
const fmtCOP = n => n ? new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',minimumFractionDigits:0}).format(n) : '-'

export default function ServicesList() {
  const navigate = useNavigate()
  const { hasMinRole } = useAuthStore()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const dSearch = useDebounce(search, 400)

  const { data, isLoading } = useQuery({
    queryKey: ['services', page, dSearch, statusFilter, priorityFilter],
    queryFn: () => servicesApi.getAll({ page, limit: 20, search: dSearch, status: statusFilter, priority: priorityFilter }).then(r => r.data),
  })

  const columns = [
    { key: 'id', label: 'ID', render: v => <span className="text-xs font-mono text-brand-400">#{v.slice(-6).toUpperCase()}</span> },
    { key: 'motorcycle', label: 'Moto / Cliente', render: (_, row) => (
      <div>
        <p className="text-sm font-medium text-white">{row.motorcycle?.brand} {row.motorcycle?.model}</p>
        <p className="text-xs text-dark-400">{row.motorcycle?.client?.fullName}</p>
      </div>
    )},
    { key: 'status', label: 'Estado', render: v => <span className={STATUS_BADGE[v] || 'badge-gray'}>{STATUS_LABELS[v]}</span> },
    { key: 'priority', label: 'Prioridad', render: v => <span className={PRIORITY_BADGE[v] || 'badge-gray'}>{v}</span> },
    { key: 'technician', label: 'Técnico', render: (_, row) => row.technician?.name || <span className="text-dark-500 text-xs">Sin asignar</span> },
    { key: 'totalCost', label: 'Total', render: v => <span className="font-medium">{fmtCOP(v)}</span> },
    { key: 'createdAt', label: 'Creado', render: v => <span className="text-xs text-dark-400">{v ? format(new Date(v), 'dd/MM/yy') : '-'}</span> },
    { key: 'id', label: 'Acciones', render: (_, row) => (
      <div className="flex gap-1">
        <button onClick={() => navigate(`/services/${row.id}`)} className="btn-ghost btn-icon btn-sm"><Eye className="w-4 h-4" /></button>
        {hasMinRole('MECHANIC') && <button onClick={() => navigate(`/services/${row.id}/edit`)} className="btn-ghost btn-icon btn-sm"><Edit className="w-4 h-4" /></button>}
      </div>
    )},
  ]

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2"><Wrench className="w-6 h-6 text-brand-400" />Servicios</h1>
          <p className="page-subtitle">Órdenes de servicio y mantenimiento</p>
        </div>
        {hasMinRole('RECEPTIONIST') && (
          <motion.button whileHover={{ scale: 1.02 }} onClick={() => navigate('/services/new')} className="btn-primary gap-2">
            <Plus className="w-4 h-4" /> Nuevo Servicio
          </motion.button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input w-auto min-w-40 py-2 text-sm">
          <option value="">Todos los estados</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
        <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="input w-auto min-w-36 py-2 text-sm">
          <option value="">Todas las prioridades</option>
          {['LOW','NORMAL','HIGH','CRITICAL'].map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <DataTable columns={columns} data={data?.data || []} loading={isLoading}
        totalCount={data?.meta?.total || 0} page={page} pageSize={20}
        onPageChange={setPage} onSearch={setSearch} searchPlaceholder="Buscar por VIN, cliente, marca..."
        emptyMessage="No hay servicios registrados." />
    </div>
  )
}
