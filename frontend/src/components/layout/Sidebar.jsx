import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Users, Bike, Wrench, ClipboardList, Package,
  Truck, ShieldCheck, BarChart3, LogOut, ChevronLeft, ChevronRight,
  Settings, Bell, Menu
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { authApi } from '../../api/auth.api'
import toast from 'react-hot-toast'

const NAV_ITEMS = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: [] },
  { path: '/clients', icon: Users, label: 'Clientes', roles: [] },
  { path: '/motorcycles', icon: Bike, label: 'Motocicletas', roles: [] },
  { path: '/services', icon: Wrench, label: 'Servicios', roles: [] },
  { path: '/checklists', icon: ClipboardList, label: 'Checklists', roles: [] },
  { path: '/inventory', icon: Package, label: 'Inventario', roles: [] },
  { path: '/suppliers', icon: Truck, label: 'Proveedores', roles: [] },
  { divider: true },
  { path: '/users', icon: Settings, label: 'Usuarios', roles: ['ADMIN', 'SUPERVISOR'] },
  { path: '/audit', icon: ShieldCheck, label: 'Auditoría', roles: ['ADMIN', 'SUPERVISOR'] },
  { path: '/reports', icon: BarChart3, label: 'Reportes', roles: ['ADMIN', 'SUPERVISOR'] },
]

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch {}
    logout()
    navigate('/login')
    toast.success('Sesión cerrada.')
  }

  const filteredItems = NAV_ITEMS.filter(item =>
    item.divider || !item.roles?.length || item.roles.includes(user?.role)
  )

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-dark-700/60 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center flex-shrink-0 shadow-lg shadow-brand-500/30">
          <Bike className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="font-bold text-white text-sm leading-tight">SKM Servicio</p>
            <p className="text-xs text-brand-400">Técnico</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {filteredItems.map((item, i) => {
          if (item.divider) return <div key={i} className="my-2 border-t border-dark-700/40" />
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen?.(false)}
              className={({ isActive }) =>
                `sidebar-item group relative ${isActive ? 'sidebar-item-active' : ''} ${collapsed ? 'justify-center px-2' : ''}`
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-dark-700 rounded-md text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg border border-dark-600">
                  {item.label}
                </div>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* User section */}
      <div className={`p-3 border-t border-dark-700/60 ${collapsed ? '' : ''}`}>
        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg mb-2 bg-dark-700/40">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-dark-400 truncate">{user?.role}</p>
            </div>
          </div>
        )}
        <button onClick={handleLogout} className={`sidebar-item w-full hover:text-red-400 ${collapsed ? 'justify-center px-2' : ''}`}>
          <LogOut className="w-5 h-5" />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 240 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="hidden lg:flex flex-col bg-dark-800 border-r border-dark-700/60 h-screen sticky top-0 z-30"
      >
        {sidebarContent}
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-5 -right-3 w-6 h-6 rounded-full bg-dark-700 border border-dark-600 flex items-center justify-center hover:bg-brand-500 hover:border-brand-500 transition-colors shadow-md"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </motion.aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
            <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed left-0 top-0 h-screen w-60 bg-dark-800 border-r border-dark-700/60 z-50 lg:hidden">
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
