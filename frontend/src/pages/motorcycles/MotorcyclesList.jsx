import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, Eye, Edit, Trash2, Bike, QrCode } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { motorcyclesApi } from '../../api/index'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import { useAuthStore } from '../../store/authStore'
import { useDebounce } from '../../hooks/useDebounce'
import { format } from 'date-fns'

export default function MotorcyclesList() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { hasMinRole } = useAuthStore()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [qrModal, setQrModal] = useState({ open: false, data: null })
  const debouncedSearch = useDebounce(search, 400)

  const { data, isLoading } = useQuery({
    queryKey: ['motorcycles', page, debouncedSearch],
    queryFn: () => motorcyclesApi.getAll({ page, limit: 20, search: debouncedSearch }).then(r => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => motorcyclesApi.delete(id),
    onSuccess: () => { toast.success('Motocicleta eliminada.'); qc.invalidateQueries(['motorcycles']) },
  })

  const showQR = async (id) => {
    const res = await motorcyclesApi.getQR(id)
    setQrModal({ open: true, data: res.data.data })
  }

  const columns = [
    { key: 'brand', label: 'Motocicleta', sortable: true, render: (v, row) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-brand-500/10 flex items-center justify-center flex-shrink-0">
          <Bike className="w-4 h-4 text-brand-400" />
        </div>
        <div>
          <p className="font-medium text-white">{v} {row.model} <span className="text-dark-400">({row.year})</span></p>
          <p className="text-xs text-dark-400">{row.displacement}cc · VIN: {row.vin}</p>
        </div>
      </div>
    )},
    { key: 'client', label: 'Propietario', render: (_, row) => (
      <div>
        <p className="text-sm text-white">{row.client?.fullName}</p>
        <p className="text-xs text-dark-400">{row.client?.phone}</p>
      </div>
    )},
    { key: 'mileage', label: 'Kilometraje', render: v => v != null ? `${v.toLocaleString('es-CO')} km` : '-' },
    { key: 'hoursUsed', label: 'Horas', render: v => v != null ? `${v} h` : '-' },
    { key: 'status', label: 'Estado', render: v => {
      const map = { ACTIVE: 'badge-green', INACTIVE: 'badge-gray', IN_SERVICE: 'badge-blue', RETIRED: 'badge-red' }
      return <span className={map[v] || 'badge-gray'}>{v}</span>
    }},
    { key: '_count', label: 'Servicios', render: v => <span className="badge-orange">{v?.services ?? 0}</span> },
    { key: 'createdAt', label: 'Registro', render: v => <span className="text-xs text-dark-400">{v ? format(new Date(v), 'dd/MM/yyyy') : '-'}</span> },
    { key: 'id', label: 'Acciones', render: (_, row) => (
      <div className="flex items-center gap-1">
        <button onClick={() => navigate(`/motorcycles/${row.id}`)} className="btn-ghost btn-icon btn-sm"><Eye className="w-4 h-4" /></button>
        <button onClick={() => showQR(row.id)} className="btn-ghost btn-icon btn-sm" title="Ver QR"><QrCode className="w-4 h-4" /></button>
        {hasMinRole('RECEPTIONIST') && <button onClick={() => navigate(`/motorcycles/${row.id}/edit`)} className="btn-ghost btn-icon btn-sm"><Edit className="w-4 h-4" /></button>}
        {hasMinRole('SUPERVISOR') && (
          <button onClick={() => { if (confirm('¿Eliminar motocicleta?')) deleteMutation.mutate(row.id) }} className="btn-danger btn-icon btn-sm"><Trash2 className="w-4 h-4" /></button>
        )}
      </div>
    )},
  ]

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2"><Bike className="w-6 h-6 text-brand-400" />Motocicletas</h1>
          <p className="page-subtitle">Registro y seguimiento de motos</p>
        </div>
        {hasMinRole('RECEPTIONIST') && (
          <motion.button whileHover={{ scale: 1.02 }} onClick={() => navigate('/motorcycles/new')} className="btn-primary gap-2">
            <Plus className="w-4 h-4" /> Nueva Moto
          </motion.button>
        )}
      </div>

      <DataTable columns={columns} data={data?.data || []} loading={isLoading}
        totalCount={data?.meta?.total || 0} page={page} pageSize={20}
        onPageChange={setPage} onSearch={setSearch} searchPlaceholder="Buscar por marca, modelo, VIN..."
        emptyMessage="No hay motocicletas registradas." />

      <Modal open={qrModal.open} onClose={() => setQrModal({ open: false, data: null })} title="Código QR — Motocicleta" size="sm">
        {qrModal.data?.qrCode && (
          <div className="flex flex-col items-center gap-4 py-4">
            <img src={qrModal.data.qrCode} alt="QR" className="w-48 h-48 rounded-xl" />
            <p className="text-dark-400 text-sm text-center">{qrModal.data.brand} {qrModal.data.model}</p>
            <p className="text-xs text-dark-500">VIN: {qrModal.data.vin}</p>
          </div>
        )}
      </Modal>
    </div>
  )
}
