import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, Edit, ToggleRight, ToggleLeft, Settings } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { usersApi } from '../../api/index'
import DataTable from '../../components/ui/DataTable'
import { useAuthStore } from '../../store/authStore'
import { useDebounce } from '../../hooks/useDebounce'
import { format } from 'date-fns'

const ROLE_BADGE = { ADMIN: 'badge-red', SUPERVISOR: 'badge-purple', MECHANIC: 'badge-blue', RECEPTIONIST: 'badge-green', VIEWER: 'badge-gray' }

export default function UsersList() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { hasRole } = useAuthStore()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const dSearch = useDebounce(search, 400)

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, dSearch],
    queryFn: () => usersApi.getAll({ page, limit: 20, search: dSearch }).then(r => r.data),
  })

  const toggleMutation = useMutation({
    mutationFn: (id) => usersApi.toggleActive(id),
    onSuccess: () => { toast.success('Usuario actualizado.'); qc.invalidateQueries(['users']) },
  })

  const columns = [
    { key: 'name', label: 'Nombre', sortable: true, render: (v, row) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-brand-500/20 flex items-center justify-center font-bold text-brand-400 text-sm flex-shrink-0">
          {v?.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-medium text-white">{v}</p>
          <p className="text-xs text-dark-400">{row.email}</p>
        </div>
      </div>
    )},
    { key: 'role', label: 'Rol', render: v => <span className={ROLE_BADGE[v] || 'badge-gray'}>{v}</span> },
    { key: 'phone', label: 'Teléfono', render: v => v || '-' },
    { key: 'isActive', label: 'Estado', render: v => v ? <span className="badge-green">Activo</span> : <span className="badge-red">Inactivo</span> },
    { key: 'twoFactorEnabled', label: '2FA', render: v => v ? <span className="badge-green">✓</span> : <span className="badge-gray">✗</span> },
    { key: 'lastLogin', label: 'Último acceso', render: v => <span className="text-xs text-dark-400">{v ? format(new Date(v), 'dd/MM/yy HH:mm') : 'Nunca'}</span> },
    { key: 'id', label: 'Acciones', render: (_, row) => (
      <div className="flex gap-1">
        {hasRole('ADMIN') && (
          <>
            <button onClick={() => navigate(`/users/${row.id}/edit`)} className="btn-ghost btn-icon btn-sm"><Edit className="w-4 h-4" /></button>
            <button onClick={() => toggleMutation.mutate(row.id)} className="btn-ghost btn-icon btn-sm">
              {row.isActive ? <ToggleRight className="w-4 h-4 text-emerald-400" /> : <ToggleLeft className="w-4 h-4 text-dark-400" />}
            </button>
          </>
        )}
      </div>
    )},
  ]

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2"><Settings className="w-6 h-6 text-brand-400" />Usuarios</h1>
          <p className="page-subtitle">Gestión de usuarios y roles del sistema</p>
        </div>
        {hasRole('ADMIN') && (
          <motion.button whileHover={{ scale: 1.02 }} onClick={() => navigate('/users/new')} className="btn-primary gap-2">
            <Plus className="w-4 h-4" /> Nuevo Usuario
          </motion.button>
        )}
      </div>
      <DataTable columns={columns} data={data?.data || []} loading={isLoading}
        totalCount={data?.meta?.total || 0} page={page} pageSize={20}
        onPageChange={setPage} onSearch={setSearch} searchPlaceholder="Buscar por nombre o email..."
        emptyMessage="No hay usuarios." />
    </div>
  )
}
