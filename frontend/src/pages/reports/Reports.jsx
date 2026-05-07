import { useState } from 'react'
import { BarChart3, Download, FileText, DollarSign, Package, Users, Wrench } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { reportsApi } from '../../api/index'

const REPORT_TYPES = [
  { key: 'services', label: 'Servicios', icon: Wrench, color: 'text-brand-400', desc: 'Listado completo de órdenes de servicio' },
  { key: 'revenue', label: 'Ingresos', icon: DollarSign, color: 'text-emerald-400', desc: 'Reporte financiero de ingresos por período' },
  { key: 'inventory', label: 'Inventario', icon: Package, color: 'text-blue-400', desc: 'Estado actual del inventario de repuestos' },
  { key: 'clients', label: 'Clientes', icon: Users, color: 'text-purple-400', desc: 'Base de datos de clientes y estadísticas' },
]

export default function Reports() {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [loading, setLoading] = useState({})

  const downloadReport = async (type, format) => {
    setLoading(p => ({ ...p, [type + format]: true }))
    try {
      const params = { format, dateFrom, dateTo }
      const fn = reportsApi[type]
      if (!fn) return
      const res = await fn(params)

      if (format === 'pdf') {
        const blob = new Blob([res.data], { type: 'application/pdf' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a'); a.href = url; a.download = `${type}-report.pdf`; a.click()
        URL.revokeObjectURL(url)
      } else if (format === 'xlsx') {
        const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a'); a.href = url; a.download = `${type}-report.xlsx`; a.click()
      } else {
        const dataStr = JSON.stringify(res.data.data, null, 2)
        const blob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a'); a.href = url; a.download = `${type}-report.json`; a.click()
      }
      toast.success(`Reporte de ${type} descargado.`)
    } catch {
      toast.error('Error al generar el reporte.')
    } finally {
      setLoading(p => ({ ...p, [type + format]: false }))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title flex items-center gap-2"><BarChart3 className="w-6 h-6 text-brand-400" />Reportes</h1>
        <p className="page-subtitle">Generación de reportes en PDF, Excel y JSON</p>
      </div>

      {/* Date filters */}
      <div className="card p-5">
        <h3 className="font-semibold text-white mb-4">Filtros de período</h3>
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="label">Desde</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input w-auto" />
          </div>
          <div>
            <label className="label">Hasta</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input w-auto" />
          </div>
          <button onClick={() => { setDateFrom(''); setDateTo('') }} className="btn-ghost btn-sm">Limpiar filtros</button>
        </div>
      </div>

      {/* Report cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {REPORT_TYPES.map(report => (
          <motion.div key={report.key} whileHover={{ y: -2 }} className="card p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-dark-700 flex items-center justify-center">
                <report.icon className={`w-5 h-5 ${report.color}`} />
              </div>
              <div>
                <p className="font-semibold text-white">{report.label}</p>
                <p className="text-xs text-dark-400">{report.desc}</p>
              </div>
            </div>
            <div className="flex gap-2">
              {['pdf', 'xlsx', 'json'].map(fmt => (
                <button key={fmt} disabled={loading[report.key + fmt]}
                  onClick={() => downloadReport(report.key, fmt)}
                  className={`btn-sm flex-1 gap-1.5 ${fmt === 'pdf' ? 'btn-danger' : fmt === 'xlsx' ? 'btn-primary' : 'btn-secondary'}`}>
                  {loading[report.key + fmt]
                    ? <div className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                    : <Download className="w-3.5 h-3.5" />
                  }
                  {fmt.toUpperCase()}
                </button>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
