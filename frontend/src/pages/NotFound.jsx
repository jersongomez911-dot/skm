import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Bike } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <Bike className="w-20 h-20 text-brand-500 mx-auto mb-6 opacity-50" />
        <h1 className="text-8xl font-bold text-gradient mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-white mb-2">Página no encontrada</h2>
        <p className="text-dark-400 mb-8">La ruta que buscas no existe o fue movida.</p>
        <Link to="/dashboard" className="btn-primary">← Volver al Dashboard</Link>
      </motion.div>
    </div>
  )
}
