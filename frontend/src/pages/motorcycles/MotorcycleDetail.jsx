import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Edit, Bike, Wrench, QrCode } from 'lucide-react'
import { format } from 'date-fns'
import { motorcyclesApi } from '../../api/index'
import Modal from '../../components/ui/Modal'
import { useState } from 'react'

const STATUS_LABELS = { PENDING: 'Pendiente', IN_PROGRESS: 'En Proceso', DONE: 'Terminado', DELIVERED: 'Entregado', CANCELLED: 'Cancelado', DIAGNOSIS: 'Diagnóstico', WAITING_PARTS: 'Esp. Repuestos', PAUSED: 'Pausado' }

export default function MotorcycleDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [qrOpen, setQrOpen] = useState(false)

  const { data: moto, isLoading } = useQuery({
    queryKey: ['motorcycle', id],
    queryFn: () => motorcyclesApi.getById(id).then(r => r.data.data),
  })
  const { data: history } = useQuery({
    queryKey: ['moto-history', id],
    queryFn: () => motorcyclesApi.getHistory(id, { page: 1, limit: 10 }).then(r => r.data.data),
  })

  if (isLoading) return <div className="h-48 card animate-pulse" />
  if (!moto) return <p className="text-dark-400">No encontrada.</p>

  const fmtCOP = n => n ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n) : '-'

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="btn-ghost btn-icon"><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex-1">
          <h1 className="page-title">{moto.brand} {moto.model} <span className="text-dark-400 font-normal">({moto.year})</span></h1>
          <p className="page-subtitle">VIN: {moto.vin} · {moto.displacement}cc</p>
        </div>
        <button onClick={() => setQrOpen(true)} className="btn-secondary gap-2"><QrCode className="w-4 h-4" />QR</button>
        <button onClick={() => navigate(`/motorcycles/${id}/edit`)} className="btn-secondary gap-2"><Edit className="w-4 h-4" />Editar</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5 space-y-4">
          <h3 className="font-semibold text-white flex items-center gap-2"><Bike className="w-4 h-4 text-brand-400" />Datos técnicos</h3>
          {[
            ['Marca', moto.brand], ['Modelo', moto.model], ['Cilindraje', `${moto.displacement}cc`],
            ['Año', moto.year], ['Color', moto.color || '-'], ['N° Motor', moto.engineNumber || '-'],
            ['Kilometraje', moto.mileage != null ? `${moto.mileage.toLocaleString('es-CO')} km` : '-'],
            ['Horas de uso', moto.hoursUsed != null ? `${moto.hoursUsed} h` : '-'],
            ['Estado', moto.status],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between text-sm">
              <span className="text-dark-400">{k}</span>
              <span className="text-white font-medium">{v}</span>
            </div>
          ))}
        </div>

        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white flex items-center gap-2"><Wrench className="w-4 h-4 text-brand-400" />Historial de Servicios</h3>
            <button onClick={() => navigate('/services/new?motorcycleId=' + id)} className="btn-primary btn-sm">+ Nuevo Servicio</button>
          </div>
          <div className="space-y-2">
            {history?.map(s => (
              <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg bg-dark-700/40 hover:bg-dark-700/60 cursor-pointer transition-colors"
                onClick={() => navigate(`/services/${s.id}`)}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{STATUS_LABELS[s.status] || s.status}</p>
                  <p className="text-xs text-dark-400">{format(new Date(s.createdAt), 'dd/MM/yyyy')} · {s.technician?.name || 'Sin técnico'}</p>
                </div>
                <span className="text-sm font-medium text-white">{fmtCOP(s.totalCost)}</span>
              </div>
            ))}
            {!history?.length && <p className="text-dark-400 text-sm text-center py-6">Sin servicios registrados</p>}
          </div>
        </div>
      </div>

      <Modal open={qrOpen} onClose={() => setQrOpen(false)} title="Código QR" size="sm">
        {moto.qrCode && (
          <div className="flex flex-col items-center gap-3 py-4">
            <img src={moto.qrCode} alt="QR" className="w-48 h-48 rounded-xl" />
            <p className="text-sm text-dark-400">{moto.brand} {moto.model} · {moto.vin}</p>
          </div>
        )}
      </Modal>
    </div>
  )
}
