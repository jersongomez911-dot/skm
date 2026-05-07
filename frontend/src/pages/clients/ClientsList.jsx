import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, Eye, Edit, ToggleLeft, ToggleRight, Users, Phone, Mail } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { clientsApi } from '../../api/index'
import DataTable from '../../components/ui/DataTable'
import { useAuthStore } from '../../store/authStore'
import { format } from 'date-fns'
import { useDebounce } from '../../hooks/useDebounce'

export default function ClientsList() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { hasMinRole } = useAuthStore()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 400)

  const { data, isLoading } = useQuery({
    queryKey: ['clients', page, debouncedSearch],
    queryFn: () => clientsApi.getAll({ page, limit: 20, search: debouncedSearch }).then(r => r.data),
  })

  const toggleMutation = useMutation({
    mutationFn: (id) => clientsApi.toggleActive(id),
    onSuccess: () => { toast.success('Cliente actualizado.'); qc.invalidateQueries(['clients']) },
  })

  const columns = [
    { key: 'fullName', label: 'Nombre', sortable: true, render: (v, row) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 font-semibold text-sm flex-shrink-0">
          {v?.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-medium text-white">{v}</p>
          <p className="text-xs text-dark-400">{row.documentNumber}</p>
        </div>
      </div>
    )},
    { key: 'phone', label: 'Teléfono', render: v => <span className="flex items-center gap-1 text-sm"><Phone className="w-3 h-3 text-dark-400" />{v}</span> },
    { key: 'email', label: 'Email', render: v => <span className="flex items-center gap-1 text-sm text-dark-300"><Mail className="w-3 h-3 text-dark-400" />{v}</span> },
    { key: 'city', label: 'Ciudad', render: v => v || '-' },
    { key: 'category', label: 'Categoría', render: v => v ? <span className="badge-blue">{v}</span> : '-' },
    { key: '_count', label: 'Motos', render: v => <span className="badge-orange">{v?.motorcycles ?? 0}</span> },
    { key: 'isActive', label: 'Estado', render: v => v ? <span className="badge-green">Activo</span> : <span className="badge-red">Inactivo</span> },
    { key: 'createdAt', label: 'Registro', render: v => <span className="text-xs text-dark-400">{v ? format(new Date(v), 'dd/MM/yyyy') : '-'}</span> },
    { key: 'id', label: 'Acciones', render: (_, row) => (
      <div className="flex items-center gap-1">
        <button onClick={() => navigate(`/clients/${row.id}`)} className="btn-ghost btn-icon btn-sm" title="Ver detalle"><Eye className="w-4 h-4" /></button>
        {hasMinRole('RECEPTIONIST') && <button onClick={() => navigate(`/clients/${row.id}/edit`)} className="btn-ghost btn-icon btn-sm" title="Editar"><Edit className="w-4 h-4" /></button>}
        {hasMinRole('SUPERVISOR') && (
          <button onClick={() => toggleMutation.mutate(row.id)} className="btn-ghost btn-icon btn-sm" title="Toggle activo">
            {row.isActive ? <ToggleRight className="w-4 h-4 text-emerald-400" /> : <ToggleLeft className="w-4 h-4 text-dark-400" />}
          </button>
        )}
      </div>
    )},
  ]

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2"><Users className="w-6 h-6 text-brand-400" />Clientes</h1>
          <p className="page-subtitle">Gestión de pilotos y clientes del taller</p>
        </div>
        {hasMinRole('RECEPTIONIST') && (
          <motion.button whileHover={{ scale: 1.02 }} onClick={() => navigate('/clients/new')} className="btn-primary gap-2">
            <Plus className="w-4 h-4" /> Nuevo Cliente
          </motion.button>
        )}
      </div>

      <DataTable
        columns={columns} data={data?.data || []} loading={isLoading}
        totalCount={data?.meta?.total || 0} page={page} pageSize={20}
        onPageChange={setPage} onSearch={setSearch} searchPlaceholder="Buscar por nombre, email, documento..."
        emptyMessage="No hay clientes registrados."
      />
    </div>
  )
}
