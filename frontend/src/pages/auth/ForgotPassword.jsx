import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft, Bike, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '../../api/auth.api'

export default function ForgotPassword() {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit } = useForm()

  const onSubmit = async ({ email }) => {
    setLoading(true)
    try {
      await authApi.forgotPassword(email)
      setSent(true)
    } catch {
      toast.error('Error al enviar el correo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg">
            <Bike className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-bold text-white">SKM Servicio Técnico</p>
            <p className="text-brand-400 text-xs">Restablecer contraseña</p>
          </div>
        </div>

        <div className="card p-8">
          {sent ? (
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">¡Correo enviado!</h2>
              <p className="text-dark-400 text-sm mb-6">Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.</p>
              <Link to="/login" className="btn-primary w-full">Volver al inicio</Link>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-white mb-1">Olvidé mi contraseña</h2>
              <p className="text-dark-400 text-sm mb-6">Ingresa tu email y te enviaremos las instrucciones.</p>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="label">Correo electrónico</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                    <input type="email" {...register('email', { required: true })} placeholder="tu@email.com" className="input pl-10" />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Enviar instrucciones'}
                </button>
              </form>
              <Link to="/login" className="flex items-center gap-2 text-dark-400 hover:text-gray-300 text-sm mt-4 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Volver al inicio
              </Link>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}
