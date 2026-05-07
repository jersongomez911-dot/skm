import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArrowLeft, Save, Bike, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { motorcyclesApi, clientsApi } from '../../api/index'

const schema = z.object({
  clientId: z.string().min(1, 'Cliente requerido'),
  brand: z.string().min(1, 'Marca requerida').max(100),
  model: z.string().min(1, 'Modelo requerido').max(100),
  displacement: z.coerce.number().int().min(1).max(3000),
  year: z.coerce.number().int().min(1980).max(new Date().getFullYear() + 1),
  vin: z.string().min(1, 'VIN requerido').max(50),
  engineNumber: z.string().max(50).optional(),
  hoursUsed: z.coerce.number().min(0).optional(),
  mileage: z.coerce.number().int().min(0).optional(),
  color: z.string().max(50).optional(),
  status: z.string().optional(),
  notes: z.string().max(2000).optional(),
})

export default function MotorcycleForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const isEdit = !!id
  const qc = useQueryClient()
  const [clientSearch, setClientSearch] = useState('')

  const { data: existing } = useQuery({
    queryKey: ['motorcycle', id],
    queryFn: () => motorcyclesApi.getById(id).then(r => r.data.data),
    enabled: isEdit,
  })

  const { data: clientsData } = useQuery({
    queryKey: ['clients-select', clientSearch],
    queryFn: () => clientsApi.getAll({ search: clientSearch, limit: 20 }).then(r => r.data.data),
  })

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (existing) reset(existing)
    else if (searchParams.get('clientId')) setValue('clientId', searchParams.get('clientId'))
  }, [existing, reset, searchParams])

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? motorcyclesApi.update(id, data) : motorcyclesApi.create(data),
    onSuccess: (res) => {
      toast.success(isEdit ? 'Moto actualizada.' : 'Moto registrada.')
      qc.invalidateQueries(['motorcycles'])
      navigate(isEdit ? `/motorcycles/${id}` : `/motorcycles/${res.data.data.id}`)
    },
  })

  const selectedClientId = watch('clientId')
  const selectedClient = clientsData?.find(c => c.id === selectedClientId)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="btn-ghost btn-icon"><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <h1 className="page-title flex items-center gap-2"><Bike className="w-6 h-6 text-brand-400" />{isEdit ? 'Editar Motocicleta' : 'Nueva Motocicleta'}</h1>
        </div>
      </div>

      <motion.form initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit(d => mutation.mutate(d))} className="card p-6 space-y-5">

        {/* Client selector */}
        <div>
          <label className="label">Cliente / Propietario *</label>
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input type="text" value={clientSearch} onChange={e => setClientSearch(e.target.value)}
              placeholder="Buscar cliente..." className="input pl-9" />
          </div>
          <select {...register('clientId')} className={`input ${errors.clientId ? 'input-error' : ''}`}>
            <option value="">Seleccionar cliente</option>
            {clientsData?.map(c => <option key={c.id} value={c.id}>{c.fullName} — {c.documentNumber}</option>)}
          </select>
          {errors.clientId && <p className="text-red-400 text-xs mt-1">{errors.clientId.message}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[
            { name: 'brand', label: 'Marca *', type: 'text', placeholder: 'KTM, Honda, Yamaha...' },
            { name: 'model', label: 'Modelo *', type: 'text', placeholder: 'SX 250, CRF 450...' },
            { name: 'displacement', label: 'Cilindraje (cc) *', type: 'number', placeholder: '250' },
            { name: 'year', label: 'Año *', type: 'number', placeholder: '2024' },
            { name: 'vin', label: 'VIN *', type: 'text', placeholder: 'Número de chasis' },
            { name: 'engineNumber', label: 'N° Motor', type: 'text', placeholder: 'Opcional' },
            { name: 'hoursUsed', label: 'Horas de uso', type: 'number', step: '0.1', placeholder: '0' },
            { name: 'mileage', label: 'Kilometraje', type: 'number', placeholder: '0' },
            { name: 'color', label: 'Color', type: 'text', placeholder: 'Naranja' },
          ].map(f => (
            <div key={f.name}>
              <label className="label">{f.label}</label>
              <input type={f.type} step={f.step} {...register(f.name)} placeholder={f.placeholder}
                className={`input ${errors[f.name] ? 'input-error' : ''}`} />
              {errors[f.name] && <p className="text-red-400 text-xs mt-1">{errors[f.name]?.message}</p>}
            </div>
          ))}
          {isEdit && (
            <div>
              <label className="label">Estado</label>
              <select {...register('status')} className="input">
                <option value="ACTIVE">Activo</option>
                <option value="INACTIVE">Inactivo</option>
                <option value="IN_SERVICE">En Servicio</option>
                <option value="RETIRED">Retirado</option>
              </select>
            </div>
          )}
        </div>
        <div>
          <label className="label">Notas</label>
          <textarea {...register('notes')} rows={3} className="input resize-none" placeholder="Observaciones sobre la moto..." />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancelar</button>
          <button type="submit" disabled={isSubmitting} className="btn-primary gap-2">
            {isSubmitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            {isEdit ? 'Guardar cambios' : 'Registrar moto'}
          </button>
        </div>
      </motion.form>
    </div>
  )
}
