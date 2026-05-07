import { useState, useMemo } from 'react'
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Search, Download } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const SkeletonRow = ({ cols }) => (
  <tr>
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-4 py-3 border-t border-dark-700/40">
        <div className="h-4 bg-dark-700 rounded animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />
      </td>
    ))}
  </tr>
)

export default function DataTable({
  columns, data = [], loading = false, totalCount = 0,
  page = 1, pageSize = 20, onPageChange, onSearch, searchPlaceholder = 'Buscar...',
  onExport, actions, emptyMessage = 'No hay datos disponibles.',
  rowKey = 'id',
}) {
  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir] = useState('asc')
  const [search, setSearch] = useState('')

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const handleSearch = (val) => {
    setSearch(val)
    onSearch?.(val)
  }

  const sortedData = useMemo(() => {
    if (!sortKey) return data
    return [...data].sort((a, b) => {
      const av = sortKey.split('.').reduce((o, k) => o?.[k], a) ?? ''
      const bv = sortKey.split('.').reduce((o, k) => o?.[k], b) ?? ''
      return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av))
    })
  }, [data, sortKey, sortDir])

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div className="card overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-3 p-4 border-b border-dark-700/40">
        {onSearch && (
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input
              type="text" value={search} onChange={e => handleSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="input pl-9 py-2 text-sm"
            />
          </div>
        )}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-dark-400">{totalCount} registros</span>
          {onExport && (
            <button onClick={onExport} className="btn-secondary btn-sm gap-1.5">
              <Download className="w-3.5 h-3.5" /> Exportar
            </button>
          )}
          {actions}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col.key} onClick={() => col.sortable && handleSort(col.key)}
                  className={col.sortable ? 'cursor-pointer select-none hover:bg-dark-600/60 transition-colors' : ''}>
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && sortKey === col.key && (
                      sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={columns.length} />)
            ) : sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-16 text-center border-t border-dark-700/40">
                  <div className="flex flex-col items-center gap-2 text-dark-400">
                    <Search className="w-10 h-10 opacity-30" />
                    <p className="text-sm">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              sortedData.map((row) => (
                <motion.tr key={row[rowKey]} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-dark-700/30 transition-colors">
                  {columns.map(col => (
                    <td key={col.key}>
                      {col.render ? col.render(row[col.key], row) : (col.key.split('.').reduce((o, k) => o?.[k], row) ?? '-')}
                    </td>
                  ))}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-dark-700/40">
          <span className="text-xs text-dark-400">
            Página {page} de {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button disabled={page <= 1} onClick={() => onPageChange?.(page - 1)} className="btn-ghost btn-icon btn-sm disabled:opacity-30">
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
              const p = i + 1
              return (
                <button key={p} onClick={() => onPageChange?.(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${p === page ? 'bg-brand-500 text-white' : 'btn-ghost'}`}>
                  {p}
                </button>
              )
            })}
            <button disabled={page >= totalPages} onClick={() => onPageChange?.(page + 1)} className="btn-ghost btn-icon btn-sm disabled:opacity-30">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
