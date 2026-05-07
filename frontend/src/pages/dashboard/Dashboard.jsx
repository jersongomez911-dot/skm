import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Wrench, AlertTriangle, Clock, CheckCircle, DollarSign, Users, Bike, Package, TrendingUp, Activity } from 'lucide-react'
import { dashboardApi } from '../../api/index'
import StatsCard from '../../components/ui/StatsCard'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'

const STATUS_LABELS = { PENDING: 'Pendiente', DIAGNOSIS: 'Diagnóstico', IN_PROGRESS: 'En Proceso', WAITING_PARTS: 'Esp. Repuestos', PAUSED: 'Pausado', DONE: 'Terminado', DELIVERED: 'Entregado', CANCELLED: 'Cancelado' }
const PRIORITY_COLORS = { LOW: '#6b7280', NORMAL: '#3b82f6', HIGH: '#f59e0b', CRITICAL: '#ef4444' }
const STATUS_COLORS = ['#f97316', '#3b82f6', '#8b5cf6', '#f59e0b', '#6b7280', '#10b981', '#06b6d4', '#ef4444']

const fmtCOP = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n || 0)

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-dark-800 border border-dark-600 rounded-lg p-3 shadow-xl text-sm">
      <p className="text-dark-300 mb-1 font-medium">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
          {p.name}: <span className="font-semibold">{typeof p.value === 'number' && p.name?.toLowerCase().includes('ingreso') ? fmtCOP(p.value) : p.value}</span>
        </p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()

  const { data: kpis, isLoading: kpiLoading } = useQuery({
    queryKey: ['dashboard-kpis'],
    queryFn: () => dashboardApi.getKpis().then(r => r.data.data),
    refetchInterval: 30000,
  })

  const { data: charts, isLoading: chartsLoading } = useQuery({
    queryKey: ['dashboard-charts'],
    queryFn: () => dashboardApi.getCharts().then(r => r.data.data),
    refetchInterval: 60000,
  })

  const { data: alerts } = useQuery({
    queryKey: ['dashboard-alerts'],
    queryFn: () => dashboardApi.getAlerts().then(r => r.data.data),
    refetchInterval: 60000,
  })

  const { data: recentServices } = useQuery({
    queryKey: ['dashboard-recent'],
    queryFn: () => dashboardApi.getRecentServices().then(r => r.data.data),
    refetchInterval: 30000,
  })

  const statusData = charts?.byStatus?.map(s => ({ name: STATUS_LABELS[s.status] || s.status, value: s._count.status })) || []
  const priorityData = charts?.byPriority?.map(p => ({ name: p.priority, value: p._count.priority, fill: PRIORITY_COLORS[p.priority] })) || []

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Activity className="w-7 h-7 text-brand-400" />
            Dashboard
          </h1>
          <p className="page-subtitle">{format(new Date(), "EEEE d 'de' MMMM, yyyy", { locale: es })}</p>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} onClick={() => navigate('/services/new')}
          className="btn-primary gap-2">
          <Wrench className="w-4 h-4" /> Nuevo Servicio
        </motion.button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <StatsCard loading={kpiLoading} title="Servicios Pendientes" value={kpis?.pending ?? 0} icon={Clock} color="yellow" onClick={() => navigate('/services?status=PENDING')} />
        <StatsCard loading={kpiLoading} title="En Proceso" value={kpis?.inProgress ?? 0} icon={Wrench} color="blue" onClick={() => navigate('/services?status=IN_PROGRESS')} />
        <StatsCard loading={kpiLoading} title="Críticos" value={kpis?.overdue ?? 0} icon={AlertTriangle} color="red" onClick={() => navigate('/services?priority=CRITICAL')} />
        <StatsCard loading={kpiLoading} title="Terminados" value={kpis?.done ?? 0} icon={CheckCircle} color="green" onClick={() => navigate('/services?status=DONE')} />
        <StatsCard loading={kpiLoading} title="Ingresos Hoy" value={fmtCOP(kpis?.todayRevenue)} icon={DollarSign} color="orange" subtitle={`Mes: ${fmtCOP(kpis?.monthRevenue)}`} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard loading={kpiLoading} title="Clientes Activos" value={kpis?.totalClients ?? 0} icon={Users} color="purple" onClick={() => navigate('/clients')} />
        <StatsCard loading={kpiLoading} title="Motocicletas" value={kpis?.totalMotorcycles ?? 0} icon={Bike} color="blue" onClick={() => navigate('/motorcycles')} />
        <StatsCard loading={kpiLoading} title="Esp. Repuestos" value={kpis?.waitingParts ?? 0} icon={Package} color="yellow" onClick={() => navigate('/services?status=WAITING_PARTS')} />
        <StatsCard loading={kpiLoading} title="Stock Bajo" value={kpis?.lowStockCount ?? 0} icon={AlertTriangle} color="red" onClick={() => navigate('/inventory?lowStock=true')} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Monthly trend */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white flex items-center gap-2"><TrendingUp className="w-4 h-4 text-brand-400" />Tendencia de Servicios e Ingresos</h3>
            <span className="badge-gray">Últimos 6 meses</span>
          </div>
          {chartsLoading ? (
            <div className="h-48 bg-dark-700 rounded-lg animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={charts?.monthly || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: '#6b7280', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line yAxisId="left" type="monotone" dataKey="services" name="Servicios" stroke="#f97316" strokeWidth={2} dot={{ fill: '#f97316', r: 4 }} />
                <Line yAxisId="right" type="monotone" dataKey="revenue" name="Ingresos" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Status distribution */}
        <div className="card p-5">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-brand-400" />Servicios por Estado</h3>
          {chartsLoading ? (
            <div className="h-48 bg-dark-700 rounded-lg animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2} dataKey="value">
                  {statusData.map((entry, i) => <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="mt-2 space-y-1">
            {statusData.slice(0, 4).map((s, i) => (
              <div key={s.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-dark-300">
                  <span className="w-2 h-2 rounded-full" style={{ background: STATUS_COLORS[i] }} /> {s.name}
                </span>
                <span className="text-white font-medium">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts + Recent Services */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Alerts */}
        <div className="card p-5">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" /> Alertas
          </h3>
          <div className="space-y-2">
            {alerts?.criticalServices?.map(s => (
              <motion.div key={s.id} whileHover={{ x: 2 }}
                className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 cursor-pointer"
                onClick={() => navigate(`/services/${s.id}`)}>
                <div className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0 animate-pulse" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{s.motorcycle?.client?.fullName}</p>
                  <p className="text-xs text-dark-400">{s.motorcycle?.brand} {s.motorcycle?.model} — {STATUS_LABELS[s.status]}</p>
                </div>
                <span className="badge-red">Crítico</span>
              </motion.div>
            ))}
            {alerts?.lowStock?.slice(0, 3).map(item => (
              <motion.div key={item.id} whileHover={{ x: 2 }}
                className="flex items-center gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 cursor-pointer"
                onClick={() => navigate('/inventory?lowStock=true')}>
                <div className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{item.name}</p>
                  <p className="text-xs text-dark-400">Stock: {item.quantity} (mín: {item.min_stock})</p>
                </div>
                <span className="badge-yellow">Stock bajo</span>
              </motion.div>
            ))}
            {!alerts?.criticalServices?.length && !alerts?.lowStock?.length && (
              <p className="text-dark-400 text-sm text-center py-4">✅ Sin alertas críticas</p>
            )}
          </div>
        </div>

        {/* Recent services */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white flex items-center gap-2"><Wrench className="w-4 h-4 text-brand-400" />Servicios Recientes</h3>
            <button onClick={() => navigate('/services')} className="text-brand-400 hover:text-brand-300 text-xs transition-colors">Ver todos →</button>
          </div>
          <div className="space-y-2">
            {recentServices?.slice(0, 6).map(s => {
              const statusColors = { PENDING: 'badge-yellow', DIAGNOSIS: 'badge-blue', IN_PROGRESS: 'badge-blue', WAITING_PARTS: 'badge-orange', PAUSED: 'badge-gray', DONE: 'badge-green', DELIVERED: 'badge-green', CANCELLED: 'badge-red' }
              return (
                <motion.div key={s.id} whileHover={{ x: 2 }}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-dark-700/40 cursor-pointer transition-colors"
                  onClick={() => navigate(`/services/${s.id}`)}>
                  <div className="w-9 h-9 rounded-lg bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                    <Bike className="w-4 h-4 text-brand-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{s.motorcycle?.client?.fullName}</p>
                    <p className="text-xs text-dark-400">{s.motorcycle?.brand} {s.motorcycle?.model}</p>
                  </div>
                  <span className={statusColors[s.status] || 'badge-gray'}>{STATUS_LABELS[s.status]}</span>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
