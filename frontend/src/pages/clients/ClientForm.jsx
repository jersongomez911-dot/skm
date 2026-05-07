import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArrowLeft, Save, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import { clientsApi } from '../../api/index'

const schema = z.object({
  fullName: z.string().min(2, 'Nombre requerido').max(255),
  documentNumber: z.string().min(5, 'Documento requerido').max(50),
  phone: z.string().min(7, 'Teléfono requerido').max(20),
  email: z.string().email('Email inválido'),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  birthDate: z.string().min(1, 'Fecha de nacimiento requerida'),
  category: z.string().max(100).optional(),
  team: z.string().max(100).optional(),
  emergencyContact: z.string().max(255).optional(),
  observations: z.string().max(5000).optional(),
})

const Field = ({ label, error, children }) => (
  <div>
    <label className="label">{label}</label>
    {children}
    {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
  </div>
)

export default function ClientForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id
  const qc = useQueryClient()

  const { data: existing } = useQuery({
    queryKey: ['client', id],
    queryFn: () => clientsApi.getById(id).then(r => r.data.data),
    enabled: isEdit,
  })

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (existing) reset({ ...existing, birthDate: existing.birthDate ? existing.birthDate.split('T')[0] : '' })
  }, [existing, reset])

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? clientsApi.update(id, data) : clientsApi.create(data),
    onSuccess: (res) => {
      toast.success(isEdit ? 'Cliente actualizado.' : 'Cliente registrado.')
      qc.invalidateQueries(['clients'])
      navigate(isEdit ? `/clients/${id}` : `/clients/${res.data.data.id}`)
    },
  })

  const fields = [
    { name: 'fullName', label: 'Nombre completo *', type: 'text', placeholder: 'Juan Pérez' },
    { name: 'documentNumber', label: 'N° Documento *', type: 'text', placeholder: 'CC 1234567890' },
    { name: 'phone', label: 'Teléfono *', type: 'tel', placeholder: '3001234567' },
    { name: 'email', label: 'Email *', type: 'email', placeholder: 'cliente@email.com' },
    { name: 'address', label: 'Dirección', type: 'text', placeholder: 'Calle 45 #12-34' },
    { name: 'city', label: 'Ciudad', type: 'text', placeholder: 'Bogotá' },
    { name: 'birthDate', label: 'Fecha de nacimiento *', type: 'date' },
    { name: 'category', label: 'Categoría Motocross', type: 'text', placeholder: 'Nacional, Departamental...' },
    { name: 'team', label: 'Equipo', type: 'text', placeholder: 'SKM Racing' },
    { name: 'emergencyContact', label: 'Contacto de emergencia', type: 'text', placeholder: 'Ana Pérez - 3001234567' },
  ]

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="btn-ghost btn-icon"><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <h1 className="page-title flex items-center gap-2"><Users className="w-6 h-6 text-brand-400" />{isEdit ? 'Editar Cliente' : 'Nuevo Cliente'}</h1>
          <p className="page-subtitle">{isEdit ? `Actualizando datos de ${existing?.fullName}` : 'Registro de nuevo piloto/cliente'}</p>
        </div>
      </div>

      <motion.form initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit(d => mutation.mutate(d))} className="card p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {fields.map(f => (
            <Field key={f.name} label={f.label} error={errors[f.name]?.message}>
              <input type={f.type} {...register(f.name)} placeholder={f.placeholder} className={`input ${errors[f.name] ? 'input-error' : ''}`} />
            </Field>
          ))}
        </div>
        <Field label="Observaciones" error={errors.observations?.message}>
          <textarea {...register('observations')} rows={3} placeholder="Notas adicionales sobre el cliente..." className="input resize-none" />
        </Field>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancelar</button>
          <button type="submit" disabled={isSubmitting} className="btn-primary gap-2">
            {isSubmitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            {isEdit ? 'Guardar cambios' : 'Registrar cliente'}
          </button>
        </div>
      </motion.form>
    </div>
  )
}
