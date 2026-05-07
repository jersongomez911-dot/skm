import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, Edit, Truck } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { suppliersApi } from '../../api/index'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import { useAuthStore } from '../../store/authStore'
import { useForm } from 'react-hook-form'

export default function SuppliersList() {
  const qc = useQueryClient()
  const { hasMinRole } = useAuthStore()
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState({ open: false, supplier: null })

  const { data, isLoading } = useQuery({
    queryKey: ['suppliers', page],
    queryFn: () => suppliersApi.getAll({ page, limit: 20 }).then(r => r.data),
  })

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm()

  const mutation = useMutation({
    mutationFn: (d) => modal.supplier ? suppliersApi.update(modal.supplier.id, d) : suppliersApi.create(d),
    onSuccess: () => { toast.success('Proveedor guardado.'); qc.invalidateQueries(['suppliers']); setModal({ open: false, supplier: null }); reset() },
  })

  const openEdit = (supplier) => { setModal({ open: true, supplier }); reset(supplier) }
  const openNew = () => { setModal({ open: true, supplier: null }); reset({}) }

  const columns = [
    { key: 'name', label: 'Nombre', sortable: true, render: (v, row) => <div><p className="font-medium text-white">{v}</p><p className="text-xs text-dark-400">{row.contact}</p></div> },
    { key: 'email', label: 'Email', render: v => v || '-' },
    { key: 'phone', label: 'Teléfono', render: v => v || '-' },
    { key: 'taxId', label: 'NIT', render: v => v || '-' },
    { key: '_count', label: 'Repuestos', render: v => <span className="badge-orange">{v?.items ?? 0}</span> },
    { key: 'isActive', label: 'Estado', render: v => v ? <span className="badge-green">Activo</span> : <span className="badge-red">Inactivo</span> },
    { key: 'id', label: 'Acciones', render: (_, row) => (
      hasMinRole('SUPERVISOR') && <button onClick={() => openEdit(row)} className="btn-ghost btn-icon btn-sm"><Edit className="w-4 h-4" /></button>
    )},
  ]

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2"><Truck className="w-6 h-6 text-brand-400" />Proveedores</h1>
          <p className="page-subtitle">Gestión de proveedores de repuestos</p>
        </div>
        {hasMinRole('SUPERVISOR') && (
          <motion.button whileHover={{ scale: 1.02 }} onClick={openNew} className="btn-primary gap-2">
            <Plus className="w-4 h-4" /> Nuevo Proveedor
          </motion.button>
        )}
      </div>

      <DataTable columns={columns} data={data?.data || []} loading={isLoading}
        totalCount={data?.meta?.total || 0} page={page} pageSize={20}
        onPageChange={setPage} emptyMessage="No hay proveedores registrados." />

      <Modal open={modal.open} onClose={() => setModal({ open: false, supplier: null })}
        title={modal.supplier ? 'Editar Proveedor' : 'Nuevo Proveedor'} size="md">
        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[['name','Nombre *','Distribuidora MX Pro'],['contact','Contacto','Pedro Gómez'],['email','Email','pedido@proveedor.com'],['phone','Teléfono','3001234567'],['taxId','NIT','900123456-7'],['address','Dirección','Calle 45 #12-34']].map(([n,l,p]) => (
              <div key={n} className={n === 'address' ? 'col-span-2' : ''}>
                <label className="label">{l}</label>
                <input {...register(n)} placeholder={p} className="input" />
              </div>
            ))}
          </div>
          <div>
            <label className="label">Notas</label>
            <textarea {...register('notes')} rows={2} className="input resize-none" />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setModal({ open: false, supplier: null })} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
