import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { inventoryApi } from '../../api/index'
import DataTable from '../../components/ui/DataTable'
import { format } from 'date-fns'

const TYPE_BADGE = { ENTRY: 'badge-green', EXIT: 'badge-red', ADJUSTMENT: 'badge-blue', SERVICE_USE: 'badge-orange' }
const TYPE_LABELS = { ENTRY: '↑ Entrada', EXIT: '↓ Salida', ADJUSTMENT: '≈ Ajuste', SERVICE_USE: '🔧 Servicio' }

export default function StockMovements() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['stock-movements', page],
    queryFn: () => inventoryApi.getMovements({ page, limit: 30 }).then(r => r.data),
  })

  const columns = [
    { key: 'createdAt', label: 'Fecha', render: v => <span className="text-xs text-dark-400">{v ? format(new Date(v), 'dd/MM/yyyy HH:mm') : '-'}</span> },
    { key: 'inventoryItem', label: 'Repuesto', render: v => <div><p className="text-sm font-medium text-white">{v?.name}</p><p className="text-xs text-dark-400">{v?.sku}</p></div> },
    { key: 'type', label: 'Tipo', render: v => <span className={TYPE_BADGE[v] || 'badge-gray'}>{TYPE_LABELS[v] || v}</span> },
    { key: 'quantity', label: 'Cantidad', render: (v, row) => <span className={`font-bold ${row.type === 'EXIT' ? 'text-red-400' : 'text-emerald-400'}`}>{v > 0 ? '+' : ''}{v}</span> },
    { key: 'previousStock', label: 'Antes', render: v => <span className="text-dark-400">{v}</span> },
    { key: 'newStock', label: 'Después', render: v => <span className="font-medium text-white">{v}</span> },
    { key: 'reference', label: 'Referencia', render: v => v || '-' },
    { key: 'user', label: 'Usuario', render: v => v?.name || '-' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="btn-ghost btn-icon"><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <h1 className="page-title">Kardex — Movimientos de Stock</h1>
          <p className="page-subtitle">Historial de entradas, salidas y ajustes</p>
        </div>
      </div>
      <DataTable columns={columns} data={data?.data || []} loading={isLoading}
        totalCount={data?.meta?.total || 0} page={page} pageSize={30}
        onPageChange={setPage} emptyMessage="Sin movimientos." />
    </div>
  )
}
