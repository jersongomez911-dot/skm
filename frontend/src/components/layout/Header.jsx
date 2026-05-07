import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation, Link } from 'react-router-dom'
import { Menu, Bell, Search, ChevronRight, CheckCircle2, AlertCircle, X, Trash2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationsApi } from '../../api/index'
import { useAuthStore } from '../../store/authStore'
import { format } from 'date-fns'

const BREADCRUMB_MAP = {
  dashboard: 'Dashboard', clients: 'Clientes', motorcycles: 'Motocicletas',
  services: 'Servicios', checklists: 'Checklists', inventory: 'Inventario',
  suppliers: 'Proveedores', users: 'Usuarios', audit: 'Auditoría', reports: 'Reportes',
  new: 'Nuevo', edit: 'Editar',
}

export default function Header({ onMenuClick }) {
  const { user } = useAuthStore()
  const location = useLocation()
  const qc = useQueryClient()
  const [notifOpen, setNotifOpen] = useState(false)
  const dropdownRef = useRef()

  const { data: unreadData } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: () => notificationsApi.getUnreadCount().then(r => r.data.data),
    refetchInterval: 30000,
  })

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getAll({ limit: 5 }).then(r => r.data.data),
    enabled: notifOpen,
  })

  const markReadMutation = useMutation({
    mutationFn: (id) => notificationsApi.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries(['notifications-unread'])
      qc.invalidateQueries(['notifications'])
    }
  })

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const pathnames = location.pathname.split('/').filter(x => x)

  return (
    <header className="h-16 bg-dark-800/80 backdrop-blur-md border-b border-dark-700/60 sticky top-0 z-20 px-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="lg:hidden p-2 text-gray-400 hover:text-white transition-colors">
          <Menu className="w-6 h-6" />
        </button>
        
        {/* Breadcrumbs */}
        <nav className="hidden sm:flex items-center gap-2 text-sm">
          <Link to="/dashboard" className="text-gray-400 hover:text-brand-400 transition-colors">Dashboard</Link>
          {pathnames.map((name, i) => {
            if (name === 'dashboard') return null
            const label = BREADCRUMB_MAP[name] || name
            const isLast = i === pathnames.length - 1
            return (
              <div key={name} className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-dark-500" />
                <span className={isLast ? 'text-white font-medium' : 'text-gray-400'}>{label}</span>
              </div>
            )
          })}
        </nav>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        <div className="relative" ref={dropdownRef}>
          <button onClick={() => setNotifOpen(!notifOpen)} className={`btn-ghost btn-icon relative ${notifOpen ? 'bg-dark-700 text-white' : ''}`}>
            <Bell className="w-5 h-5" />
            {unreadData?.count > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-brand-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center ring-2 ring-dark-800">
                {unreadData?.count > 9 ? '9+' : unreadData?.count}
              </span>
            )}
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-2 w-80 card shadow-2xl overflow-hidden z-50">
                <div className="p-3 border-b border-dark-700/60 flex items-center justify-between bg-dark-700/30">
                  <h3 className="font-semibold text-sm">Notificaciones</h3>
                  <button onClick={() => setNotifOpen(false)} className="text-gray-400 hover:text-white"><X className="w-4 h-4" /></button>
                </div>
                <div className="max-h-[350px] overflow-y-auto">
                  {notifications?.length > 0 ? (
                    notifications.map(n => (
                      <div key={n.id} onClick={() => !n.isRead && markReadMutation.mutate(n.id)} 
                        className={`p-3 border-b border-dark-700/40 cursor-pointer transition-colors hover:bg-dark-700/50 ${!n.isRead ? 'bg-brand-500/5' : ''}`}>
                        <div className="flex gap-3">
                          <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${n.type === 'ALERT' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>
                            {n.type === 'ALERT' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-white mb-0.5">{n.title}</p>
                            <p className="text-[11px] text-gray-400 leading-relaxed mb-1">{n.message}</p>
                            <p className="text-[10px] text-dark-500">{format(new Date(n.createdAt), 'MMM d, h:mm a')}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-gray-500 text-sm">No tienes notificaciones</div>
                  )}
                </div>
                <Link to="/notifications" className="block p-2 text-center text-xs text-brand-400 hover:text-brand-300 bg-dark-700/30 transition-colors">Ver todas</Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-3 pl-2 border-l border-dark-700/60 ml-2">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-white leading-none">{user?.name}</p>
            <p className="text-[10px] text-brand-400 mt-1">{user?.role}</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-xs font-bold text-white ring-2 ring-dark-700 shadow-lg">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  )
}
