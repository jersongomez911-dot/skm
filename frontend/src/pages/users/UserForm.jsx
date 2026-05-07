import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArrowLeft, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { usersApi } from '../../api/index'

const schema = z.object({
  name: z.string().min(2, 'Nombre requerido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8).optional().or(z.literal('')),
  role: z.string().min(1, 'Rol requerido'),
  phone: z.string().max(20).optional(),
})

export default function UserForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id
  const qc = useQueryClient()

  const { data: existing } = useQuery({
    queryKey: ['user', id],
    queryFn: () => usersApi.getById(id).then(r => r.data.data),
    enabled: isEdit,
  })

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) })

  useEffect(() => { if (existing) reset({ ...existing, password: '' }) }, [existing, reset])

  const mutation = useMutation({
    mutationFn: (data) => {
      const payload = { ...data }
      if (!payload.password) delete payload.password
      return isEdit ? usersApi.update(id, payload) : usersApi.create(payload)
    },
    onSuccess: () => { toast.success(isEdit ? 'Usuario actualizado.' : 'Usuario creado.'); qc.invalidateQueries(['users']); navigate('/users') },
  })

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="btn-ghost btn-icon"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="page-title">{isEdit ? 'Editar Usuario' : 'Nuevo Usuario'}</h1>
      </div>
      <motion.form initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit(d => mutation.mutate(d))} className="card p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="label">Nombre completo *</label>
            <input {...register('name')} className={`input ${errors.name ? 'input-error' : ''}`} />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="label">Email *</label>
            <input type="email" {...register('email')} className={`input ${errors.email ? 'input-error' : ''}`} />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="label">{isEdit ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña *'}</label>
            <input type="password" {...register('password')} className={`input ${errors.password ? 'input-error' : ''}`} placeholder={isEdit ? 'Dejar vacío' : 'Mínimo 8 caracteres'} />
            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
          </div>
          <div>
            <label className="label">Rol *</label>
            <select {...register('role')} className={`input ${errors.role ? 'input-error' : ''}`}>
              <option value="">Seleccionar rol</option>
              <option value="ADMIN">Administrador</option>
              <option value="SUPERVISOR">Supervisor</option>
              <option value="MECHANIC">Mecánico</option>
              <option value="RECEPTIONIST">Recepcionista</option>
              <option value="VIEWER">Solo Lectura</option>
            </select>
          </div>
          <div>
            <label className="label">Teléfono</label>
            <input {...register('phone')} className="input" placeholder="3001234567" />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancelar</button>
          <button type="submit" disabled={isSubmitting} className="btn-primary gap-2">
            {isSubmitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            {isEdit ? 'Guardar cambios' : 'Crear usuario'}
          </button>
        </div>
      </motion.form>
    </div>
  )
}
