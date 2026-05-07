import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Lock, Bike } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '../../api/auth.api'

const schema = z.object({
  password: z.string().min(8).regex(/[A-Z]/, 'Debe tener mayúscula').regex(/[0-9]/, 'Debe tener número'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, { message: 'Las contraseñas no coinciden', path: ['confirmPassword'] })

export default function ResetPassword() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async ({ password, confirmPassword }) => {
    try {
      await authApi.resetPassword({ token: params.get('token'), password, confirmPassword })
      toast.success('Contraseña restablecida. Inicia sesión.')
      navigate('/login')
    } catch {}
  }

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
            <Bike className="w-6 h-6 text-white" />
          </div>
          <p className="font-bold text-white">SKM Servicio Técnico</p>
        </div>
        <div className="card p-8">
          <h2 className="text-xl font-bold text-white mb-1">Nueva contraseña</h2>
          <p className="text-dark-400 text-sm mb-6">Mínimo 8 caracteres, una mayúscula y un número.</p>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Nueva contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                <input type="password" {...register('password')} className={`input pl-10 ${errors.password ? 'input-error' : ''}`} />
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>
            <div>
              <label className="label">Confirmar contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                <input type="password" {...register('confirmPassword')} className={`input pl-10 ${errors.confirmPassword ? 'input-error' : ''}`} />
              </div>
              {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword.message}</p>}
            </div>
            <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
              {isSubmitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Restablecer contraseña'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
