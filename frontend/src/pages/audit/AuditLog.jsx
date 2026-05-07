import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ShieldCheck } from 'lucide-react'
import { auditApi } from '../../api/index'
import DataTable from '../../components/ui/DataTable'
import { format } from 'date-fns'

export default function AuditLog() {
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['audit', page],
    queryFn: () => auditApi.getAll({ page, limit: 30 }).then(r => r.data),
  })

  const columns = [
    { key: 'createdAt', label: 'Fecha', render: v => <span className="text-xs text-dark-400">{v ? format(new Date(v), 'dd/MM/yy HH:mm:ss') : '-'}</span> },
    { key: 'user', label: 'Usuario', render: (v, row) => <div><p className="text-sm text-white">{v?.name || row.userEmail}</p><p className="text-xs text-dark-400">{row.ipAddress}</p></div> },
    { key: 'action', label: 'Acción', render: v => <span className="badge-orange text-xs">{v}</span> },
    { key: 'entity', label: 'Entidad', render: v => <span className="badge-blue text-xs">{v}</span> },
    { key: 'entityId', label: 'ID Entidad', render: v => <span className="text-xs font-mono text-dark-400">{v?.slice(-8)}</span> },
    { key: 'userAgent', label: 'User Agent', render: v => <span className="text-xs text-dark-500 truncate block max-w-32">{v}</span> },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title flex items-center gap-2"><ShieldCheck className="w-6 h-6 text-brand-400" />Auditoría</h1>
        <p className="page-subtitle">Registro completo de acciones del sistema</p>
      </div>
      <DataTable columns={columns} data={data?.data || []} loading={isLoading}
        totalCount={data?.meta?.total || 0} page={page} pageSize={30}
        onPageChange={setPage} emptyMessage="Sin registros de auditoría." />
    </div>
  )
}
