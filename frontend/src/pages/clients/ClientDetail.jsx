import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Edit, Bike, Phone, Mail, MapPin, Calendar, Users, Wrench } from 'lucide-react'
import { format } from 'date-fns'
import { clientsApi, servicesApi } from '../../api/index'
import { motion } from 'framer-motion'

const ROLE_LABELS = { PENDING: 'Pendiente', IN_PROGRESS: 'En Proceso', DONE: 'Terminado', DELIVERED: 'Entregado', CANCELLED: 'Cancelado', DIAGNOSIS: 'Diagnóstico', WAITING_PARTS: 'Esp. Repuestos', PAUSED: 'Pausado' }

export default function ClientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', id],
    queryFn: () => clientsApi.getById(id).then(r => r.data.data),
  })

  const { data: historyData } = useQuery({
    queryKey: ['client-history', id],
    queryFn: () => clientsApi.getHistory(id, { page: 1, limit: 10 }).then(r => r.data),
    enabled: !!id,
  })

  if (isLoading) return (
    <div className="space-y-4">
      <div className="h-8 bg-dark-700 rounded animate-pulse w-1/3" />
      <div className="card p-6 h-48 animate-pulse bg-dark-700" />
    </div>
  )

  if (!client) return <p className="text-dark-400">Cliente no encontrado.</p>

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="btn-ghost btn-icon"><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex-1">
          <h1 className="page-title">{client.fullName}</h1>
          <p className="page-subtitle">{client.documentNumber} · {client.isActive ? <span className="text-emerald-400">Activo</span> : <span className="text-red-400">Inactivo</span>}</p>
        </div>
        <button onClick={() => navigate(`/clients/${id}/edit`)} className="btn-secondary gap-2"><Edit className="w-4 h-4" />Editar</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Info card */}
        <div className="card p-5 space-y-4 lg:col-span-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-14 h-14 rounded-2xl bg-brand-500/20 flex items-center justify-center text-2xl font-bold text-brand-400">
              {client.fullName.charAt(0)}
            </div>
            <div>
              <p className="font-semibold text-white">{client.fullName}</p>
              {client.category && <span className="badge-blue text-xs">{client.category}</span>}
            </div>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-dark-300"><Phone className="w-4 h-4 text-dark-400" />{client.phone}</div>
            <div className="flex items-center gap-2 text-dark-300"><Mail className="w-4 h-4 text-dark-400" />{client.email}</div>
            {client.city && <div className="flex items-center gap-2 text-dark-300"><MapPin className="w-4 h-4 text-dark-400" />{client.city}</div>}
            {client.birthDate && <div className="flex items-center gap-2 text-dark-300"><Calendar className="w-4 h-4 text-dark-400" />{format(new Date(client.birthDate), 'dd/MM/yyyy')}</div>}
            {client.team && <div className="flex items-center gap-2 text-dark-300"><Users className="w-4 h-4 text-dark-400" />{client.team}</div>}
          </div>
          {client.emergencyContact && (
            <div className="p-3 bg-dark-700/40 rounded-lg text-sm">
              <p className="text-dark-400 text-xs mb-1">Contacto emergencia</p>
              <p className="text-white">{client.emergencyContact}</p>
            </div>
          )}
        </div>

        {/* Motorcycles */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white flex items-center gap-2"><Bike className="w-4 h-4 text-brand-400" />Motocicletas ({client.motorcycles?.length || 0})</h3>
            <button onClick={() => navigate(`/motorcycles/new?clientId=${id}`)} className="btn-primary btn-sm gap-1">+ Nueva Moto</button>
          </div>
          <div className="space-y-3">
            {client.motorcycles?.map(moto => (
              <motion.div key={moto.id} whileHover={{ x: 4 }}
                className="flex items-center gap-4 p-4 rounded-xl bg-dark-700/40 border border-dark-700/60 hover:border-brand-500/30 cursor-pointer transition-all"
                onClick={() => navigate(`/motorcycles/${moto.id}`)}>
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                  <Bike className="w-5 h-5 text-brand-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white">{moto.brand} {moto.model} {moto.year}</p>
                  <p className="text-xs text-dark-400">VIN: {moto.vin} · {moto.displacement}cc</p>
                </div>
                <div className="text-right">
                  <span className={`badge ${moto.status === 'ACTIVE' ? 'badge-green' : 'badge-gray'}`}>{moto.status}</span>
                  <p className="text-xs text-dark-400 mt-1">{moto._count?.services || 0} servicios</p>
                </div>
              </motion.div>
            ))}
            {!client.motorcycles?.length && <p className="text-dark-400 text-sm text-center py-4">Sin motocicletas registradas</p>}
          </div>
        </div>
      </div>

      {/* Service History */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white flex items-center gap-2"><Wrench className="w-4 h-4 text-brand-400" />Historial de Servicios</h3>
          <button onClick={() => navigate(`/services?clientId=${id}`)} className="text-brand-400 text-xs hover:text-brand-300">Ver todos →</button>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead><tr><th>Fecha</th><th>Motocicleta</th><th>Estado</th><th>Técnico</th><th>Total</th><th></th></tr></thead>
            <tbody>
              {historyData?.data?.map(s => (
                <tr key={s.id} className="cursor-pointer" onClick={() => navigate(`/services/${s.id}`)}>
                  <td className="text-xs text-dark-400">{format(new Date(s.createdAt), 'dd/MM/yyyy')}</td>
                  <td>{s.motorcycle?.brand} {s.motorcycle?.model}</td>
                  <td><span className="badge-blue text-xs">{ROLE_LABELS[s.status] || s.status}</span></td>
                  <td className="text-dark-300">{s.technician?.name || '-'}</td>
                  <td className="font-medium">{s.totalCost ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(s.totalCost) : '-'}</td>
                  <td><button className="text-brand-400 text-xs">Ver →</button></td>
                </tr>
              ))}
              {!historyData?.data?.length && <tr><td colSpan={6} className="text-center py-8 text-dark-400">Sin servicios registrados</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
