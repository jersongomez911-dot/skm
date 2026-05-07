import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, Eye, Edit, Package, AlertTriangle } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { inventoryApi } from '../../api/index'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import { useAuthStore } from '../../store/authStore'
import { useDebounce } from '../../hooks/useDebounce'

const fmtCOP = n => new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',minimumFractionDigits:0}).format(n||0)

export default function InventoryList() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { hasMinRole } = useAuthStore()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [stockModal, setStockModal] = useState({ open: false, item: null })
  const [movement, setMovement] = useState({ type: 'ENTRY', quantity: 1, notes: '', reference: '' })
  const dSearch = useDebounce(search, 400)

  const { data, isLoading } = useQuery({
    queryKey: ['inventory', page, dSearch],
    queryFn: () => inventoryApi.getAll({ page, limit: 20, search: dSearch }).then(r => r.data),
  })

  const movementMutation = useMutation({
    mutationFn: () => inventoryApi.addMovement(stockModal.item.id, { ...movement, quantity: Number(movement.quantity) }),
    onSuccess: () => { toast.success('Movimiento registrado.'); qc.invalidateQueries(['inventory']); setStockModal({ open: false, item: null }) },
  })

  const columns = [
    { key: 'sku', label: 'SKU', render: v => <span className="text-xs font-mono text-brand-400">{v}</span> },
    { key: 'name', label: 'Nombre', sortable: true, render: (v, row) => (
      <div>
        <p className="font-medium text-white">{v}</p>
        <p className="text-xs text-dark-400">{row.category} · {row.brand}</p>
      </div>
    )},
    { key: 'quantity', label: 'Stock', render: (v, row) => (
      <div className="flex items-center gap-2">
        <span className={`font-bold ${v <= row.minStock ? 'text-red-400' : v <= row.minStock * 1.5 ? 'text-yellow-400' : 'text-emerald-400'}`}>{v}</span>
        {v <= row.minStock && <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />}
      </div>
    )},
    { key: 'minStock', label: 'Mín.', render: v => <span className="text-dark-400 text-sm">{v}</span> },
    { key: 'unitCost', label: 'Costo', render: v => fmtCOP(v) },
    { key: 'salePrice', label: 'Venta', render: v => fmtCOP(v) },
    { key: 'supplier', label: 'Proveedor', render: v => v?.name || '-' },
    { key: 'isActive', label: 'Estado', render: v => v ? <span className="badge-green">Activo</span> : <span className="badge-red">Inactivo</span> },
    { key: 'id', label: 'Acciones', render: (_, row) => (
      <div className="flex gap-1">
        {hasMinRole('SUPERVISOR') && (
          <>
            <button onClick={() => { setStockModal({ open: true, item: row }) }} className="btn-primary btn-sm gap-1"><Package className="w-3 h-3" />Stock</button>
            <button onClick={() => navigate(`/inventory/${row.id}/edit`)} className="btn-ghost btn-icon btn-sm"><Edit className="w-4 h-4" /></button>
          </>
        )}
      </div>
    )},
  ]

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2"><Package className="w-6 h-6 text-brand-400" />Inventario</h1>
          <p className="page-subtitle">Control de repuestos y stock</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/inventory/movements')} className="btn-secondary gap-2">📊 Kardex</button>
          {hasMinRole('SUPERVISOR') && (
            <motion.button whileHover={{ scale: 1.02 }} onClick={() => navigate('/inventory/new')} className="btn-primary gap-2">
              <Plus className="w-4 h-4" /> Nuevo Repuesto
            </motion.button>
          )}
        </div>
      </div>

      <DataTable columns={columns} data={data?.data || []} loading={isLoading}
        totalCount={data?.meta?.total || 0} page={page} pageSize={20}
        onPageChange={setPage} onSearch={setSearch} searchPlaceholder="Buscar por nombre, SKU, marca..."
        emptyMessage="No hay repuestos registrados." />

      <Modal open={stockModal.open} onClose={() => setStockModal({ open: false, item: null })}
        title={`Movimiento de Stock — ${stockModal.item?.name}`} size="sm">
        <div className="space-y-4">
          <div className="p-3 bg-dark-700/40 rounded-lg text-sm">
            <p className="text-dark-400">Stock actual: <span className="text-white font-bold">{stockModal.item?.quantity}</span></p>
          </div>
          <div>
            <label className="label">Tipo de movimiento</label>
            <select value={movement.type} onChange={e => setMovement(p => ({...p, type: e.target.value}))} className="input">
              <option value="ENTRY">Entrada (+)</option>
              <option value="EXIT">Salida (-)</option>
              <option value="ADJUSTMENT">Ajuste (absoluto)</option>
            </select>
          </div>
          <div>
            <label className="label">Cantidad</label>
            <input type="number" min="0.01" step="0.01" value={movement.quantity} onChange={e => setMovement(p => ({...p, quantity: e.target.value}))} className="input" />
          </div>
          <div>
            <label className="label">Referencia</label>
            <input type="text" value={movement.reference} onChange={e => setMovement(p => ({...p, reference: e.target.value}))} className="input" placeholder="N° factura, OC..." />
          </div>
          <div>
            <label className="label">Notas</label>
            <textarea value={movement.notes} onChange={e => setMovement(p => ({...p, notes: e.target.value}))} rows={2} className="input resize-none" />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setStockModal({ open: false, item: null })} className="btn-secondary">Cancelar</button>
            <button disabled={movementMutation.isPending} onClick={() => movementMutation.mutate()} className="btn-primary">
              {movementMutation.isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Registrar'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
