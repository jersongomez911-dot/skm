import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArrowLeft, Save, Package } from 'lucide-react'
import toast from 'react-hot-toast'
import { inventoryApi, suppliersApi } from '../../api/index'

export default function InventoryForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id
  const qc = useQueryClient()

  const { data: existing } = useQuery({
    queryKey: ['inventory-item', id],
    queryFn: () => inventoryApi.getById(id).then(r => r.data.data),
    enabled: isEdit,
  })

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers-all'],
    queryFn: () => suppliersApi.getAll({ limit: 100 }).then(r => r.data.data),
  })

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm()

  useEffect(() => { if (existing) reset(existing) }, [existing, reset])

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? inventoryApi.update(id, data) : inventoryApi.create({ ...data, quantity: Number(data.quantity), minStock: Number(data.minStock), unitCost: Number(data.unitCost), salePrice: Number(data.salePrice) }),
    onSuccess: () => { toast.success(isEdit ? 'Repuesto actualizado.' : 'Repuesto creado.'); qc.invalidateQueries(['inventory']); navigate('/inventory') },
  })

  const fields = [
    { name: 'sku', label: 'SKU *', placeholder: 'FIL-AIR-001' },
    { name: 'name', label: 'Nombre *', placeholder: 'Filtro de Aire KTM SX 250' },
    { name: 'category', label: 'Categoría', placeholder: 'Filtros, Lubricantes, Frenos...' },
    { name: 'brand', label: 'Marca', placeholder: 'KTM, Motul, EBC...' },
    { name: 'location', label: 'Ubicación en bodega', placeholder: 'Estante A-3' },
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="btn-ghost btn-icon"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="page-title flex items-center gap-2"><Package className="w-6 h-6 text-brand-400" />{isEdit ? 'Editar Repuesto' : 'Nuevo Repuesto'}</h1>
      </div>

      <motion.form initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit(d => mutation.mutate(d))} className="card p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {fields.map(f => (
            <div key={f.name}>
              <label className="label">{f.label}</label>
              <input {...register(f.name)} placeholder={f.placeholder} className="input" />
            </div>
          ))}
          <div>
            <label className="label">Stock inicial</label>
            <input type="number" step="0.01" min="0" {...register('quantity')} placeholder="0" className="input" disabled={isEdit} />
          </div>
          <div>
            <label className="label">Stock mínimo</label>
            <input type="number" step="0.01" min="0" {...register('minStock')} placeholder="5" className="input" />
          </div>
          <div>
            <label className="label">Costo unitario</label>
            <input type="number" min="0" {...register('unitCost')} placeholder="0" className="input" />
          </div>
          <div>
            <label className="label">Precio de venta</label>
            <input type="number" min="0" {...register('salePrice')} placeholder="0" className="input" />
          </div>
          <div>
            <label className="label">Proveedor</label>
            <select {...register('supplierId')} className="input">
              <option value="">Sin proveedor</option>
              {suppliers?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Descripción</label>
          <textarea {...register('description')} rows={2} className="input resize-none" />
        </div>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancelar</button>
          <button type="submit" disabled={isSubmitting} className="btn-primary gap-2">
            {isSubmitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            {isEdit ? 'Guardar' : 'Crear repuesto'}
          </button>
        </div>
      </motion.form>
    </div>
  )
}
