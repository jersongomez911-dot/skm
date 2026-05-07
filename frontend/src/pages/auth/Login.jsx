import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Bike, Lock, Mail, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '../../api/auth.api'
import { useAuthStore } from '../../store/authStore'

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
})

export default function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const res = await authApi.login(data)
      const { accessToken, user } = res.data.data
      login(user, accessToken)
      toast.success(`¡Bienvenido, ${user.name}!`)
      navigate('/dashboard')
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al iniciar sesión'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-900 flex">
      {/* Left — Brand panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-dark-800 via-dark-900 to-dark-800 p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-brand-500/10 blur-3xl" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-brand-700/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-brand-500/5" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-brand-500/10" />
        </div>

        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-500/30">
              <Bike className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-white">SKM Servicio</p>
              <p className="text-brand-400 text-sm font-medium">Técnico</p>
            </div>
          </div>
        </div>

        <div className="relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
              Sistema Integral de<br />
              <span className="text-gradient">Gestión para Taller</span><br />
              Motocross
            </h1>
            <p className="text-dark-300 text-lg mb-8">Gestiona servicios, clientes, inventario y más desde una sola plataforma profesional.</p>
            <div className="grid grid-cols-2 gap-4">
              {['Control de Servicios', 'Inventario Inteligente', 'Auditoría Completa', 'Reportes Avanzados'].map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-dark-300 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                  {feature}
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="relative text-dark-500 text-xs">
          © 2024 SKM Servicio Técnico. Sistema de Gestión v1.0
        </div>
      </div>

      {/* Right — Login form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg">
              <Bike className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-white">SKM Servicio Técnico</p>
              <p className="text-brand-400 text-xs">Sistema de Gestión</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white">Iniciar sesión</h2>
            <p className="text-dark-400 mt-1 text-sm">Ingresa tus credenciales para acceder al sistema</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="label">Correo electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                <input id="email" type="email" {...register('email')} placeholder="admin@skm.com"
                  className={`input pl-10 ${errors.email ? 'input-error' : ''}`} />
              </div>
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                <input id="password" type={showPassword ? 'text' : 'password'} {...register('password')}
                  placeholder="••••••••" className={`input pl-10 pr-10 ${errors.password ? 'input-error' : ''}`} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-gray-300 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div className="flex items-center justify-end">
              <Link to="/forgot-password" className="text-brand-400 hover:text-brand-300 text-sm transition-colors">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <button id="login-btn" type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : 'Ingresar al Sistema'}
            </button>
          </form>

          {/* 
          <div className="mt-6 p-4 rounded-xl bg-dark-700/40 border border-dark-600/60">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-brand-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-dark-300 font-medium mb-1">Credenciales de prueba:</p>
                <p className="text-xs text-dark-400">admin@skm.com / Admin123!</p>
                <p className="text-xs text-dark-400">mecanico@skm.com / Admin123!</p>
              </div>
            </div>
          </div> 
          */}
        </motion.div>
      </div>
    </div>
  )
}
