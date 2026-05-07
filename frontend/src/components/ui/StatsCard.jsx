import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown } from 'lucide-react'

export default function StatsCard({ title, value, icon: Icon, color = 'orange', trend, trendLabel, loading, subtitle, onClick }) {
  const colors = {
    orange: { bg: 'from-brand-500/20 to-brand-600/10', icon: 'text-brand-400', border: 'border-brand-500/30', glow: 'shadow-brand-500/10' },
    green:  { bg: 'from-emerald-500/20 to-emerald-600/10', icon: 'text-emerald-400', border: 'border-emerald-500/30', glow: 'shadow-emerald-500/10' },
    blue:   { bg: 'from-blue-500/20 to-blue-600/10', icon: 'text-blue-400', border: 'border-blue-500/30', glow: 'shadow-blue-500/10' },
    red:    { bg: 'from-red-500/20 to-red-600/10', icon: 'text-red-400', border: 'border-red-500/30', glow: 'shadow-red-500/10' },
    yellow: { bg: 'from-yellow-500/20 to-yellow-600/10', icon: 'text-yellow-400', border: 'border-yellow-500/30', glow: 'shadow-yellow-500/10' },
    purple: { bg: 'from-purple-500/20 to-purple-600/10', icon: 'text-purple-400', border: 'border-purple-500/30', glow: 'shadow-purple-500/10' },
  }
  const c = colors[color] || colors.orange

  if (loading) return (
    <div className="stat-card">
      <div className="h-4 bg-dark-700 rounded animate-pulse w-1/2" />
      <div className="h-8 bg-dark-700 rounded animate-pulse w-3/4" />
      <div className="h-3 bg-dark-700 rounded animate-pulse w-1/3" />
    </div>
  )

  return (
    <motion.div whileHover={{ scale: 1.02, y: -2 }} whileTap={onClick ? { scale: 0.98 } : {}}
      onClick={onClick} className={`stat-card border ${c.border} shadow-lg ${c.glow} ${onClick ? 'cursor-pointer' : ''} bg-gradient-to-br ${c.bg} relative overflow-hidden`}>
      <div className="flex items-start justify-between">
        <p className="text-sm text-dark-400 font-medium">{title}</p>
        {Icon && (
          <div className={`w-10 h-10 rounded-xl bg-dark-700/60 flex items-center justify-center ${c.icon}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="mt-1">
        <motion.p initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-white animate-count">
          {value}
        </motion.p>
        {subtitle && <p className="text-xs text-dark-400 mt-0.5">{subtitle}</p>}
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 text-xs font-medium ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          <span>{trend >= 0 ? '+' : ''}{trend}% {trendLabel}</span>
        </div>
      )}
    </motion.div>
  )
}
