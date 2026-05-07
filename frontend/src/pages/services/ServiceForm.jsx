import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArrowLeft, Save, Wrench, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { servicesApi, motorcyclesApi } from '../../api/index'
import { useAuthStore } from '../../store/authStore'
import { useDebounce } from '../../hooks/useDebounce'
import { AnimatePresence } from 'framer-motion'
import { Check, Loader2 } from 'lucide-react'

export default function ServiceForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const isEdit = !!id
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const [motoSearch, setMotoSearch] = useState('')
  const debouncedSearch = useDebounce(motoSearch, 400)
  const [selectedMoto, setSelectedMoto] = useState(null)
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef(null)

  const { data: existing } = useQuery({
    queryKey: ['service', id],
    queryFn: () => servicesApi.getById(id).then(r => r.data.data),
    enabled: isEdit,
  })

  const { data: motos, isFetching: isMotosFetching } = useQuery({
    queryKey: ['motorcycles-select', debouncedSearch],
    queryFn: () => motorcyclesApi.getAll({ search: debouncedSearch, limit: 10 }).then(r => r.data.data),
  })

  const { register, handleSubmit, reset, setValue, formState: { isSubmitting } } = useForm()

  useEffect(() => {
    if (existing) {
      reset({ ...existing })
      setSelectedMoto(existing.motorcycle)
    } else if (searchParams.get('motorcycleId')) {
      const motoId = searchParams.get('motorcycleId')
      setValue('motorcycleId', motoId)
      // Fetch specifically this moto to show its details if needed, 
      // but for now we at least set the value.
    }
  }, [existing, reset, searchParams, setValue])

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? servicesApi.update(id, data) : servicesApi.create(data),
    onSuccess: (res) => {
      toast.success(isEdit ? 'Servicio actualizado.' : 'Servicio creado.')
      qc.invalidateQueries(['services'])
      navigate(isEdit ? `/services/${id}` : `/services/${res.data.data.id}`)
    },
  })

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="btn-ghost btn-icon"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="page-title flex items-center gap-2"><Wrench className="w-6 h-6 text-brand-400" />{isEdit ? 'Editar Servicio' : 'Nuevo Servicio'}</h1>
      </div>

      <motion.form initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit(d => mutation.mutate(d))} className="card p-6 space-y-5">

        <div className="relative">
          <label className="label">Motocicleta *</label>
          
          {selectedMoto ? (
            <div className="p-4 rounded-xl bg-brand-500/10 border border-brand-500/20 flex justify-between items-center group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-brand-500/20 flex items-center justify-center text-brand-400">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{selectedMoto.brand} {selectedMoto.model} ({selectedMoto.year})</p>
                  <p className="text-xs text-dark-400">{selectedMoto.client?.fullName} • VIN: {selectedMoto.vin}</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => { setSelectedMoto(null); setValue('motorcycleId', ''); setMotoSearch('') }}
                className="text-xs text-brand-400 hover:text-brand-300 font-medium px-3 py-1.5 rounded-lg hover:bg-brand-500/10 transition-colors"
              >
                Cambiar
              </button>
            </div>
          ) : (
            <div className="relative" ref={searchRef}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
              <input 
                type="text" 
                value={motoSearch} 
                onChange={e => { setMotoSearch(e.target.value); setShowResults(true) }} 
                onFocus={() => setShowResults(true)}
                placeholder="Busca por placa, VIN, marca o cliente..." 
                className="input pl-10" 
                autoComplete="off"
              />
              
              {isMotosFetching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-4 h-4 text-brand-400 animate-spin" />
                </div>
              )}

              <AnimatePresence>
                {showResults && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute z-50 left-0 right-0 mt-2 bg-dark-800 rounded-xl border border-dark-600 shadow-2xl overflow-hidden max-h-60 overflow-y-auto divide-y divide-dark-700/50 backdrop-blur-md"
                  >
                    {motos?.length > 0 ? (
                      motos.map(m => (
                        <button 
                          key={m.id} 
                          type="button"
                          onClick={() => {
                            setSelectedMoto(m)
                            setValue('motorcycleId', m.id)
                            setShowResults(false)
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-brand-500/10 flex justify-between items-center group transition-colors"
                        >
                          <div className="min-w-0 flex-1 pr-4">
                            <p className="text-sm font-bold text-white group-hover:text-brand-400 transition-colors truncate">{m.brand} {m.model} ({m.year})</p>
                            <p className="text-[10px] text-dark-500 truncate">{m.client?.fullName} • VIN: {m.vin}</p>
                          </div>
                          <Check className="w-4 h-4 text-brand-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))
                    ) : !isMotosFetching && (
                      <div className="p-8 text-center text-dark-400">
                        <p className="text-sm">No se encontraron motocicletas.</p>
                        <p className="text-xs mt-1">Intenta con VIN, Placa o Cliente.</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
          <input type="hidden" {...register('motorcycleId', { required: true })} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="label">Prioridad</label>
            <select {...register('priority')} className="input">
              <option value="LOW">Baja</option>
              <option value="NORMAL" selected>Normal</option>
              <option value="HIGH">Alta</option>
              <option value="CRITICAL">Crítica</option>
            </select>
          </div>
          <div>
            <label className="label">SLA (horas máx)</label>
            <input type="number" {...register('slaHours')} placeholder="24" className="input" min="1" />
          </div>
          <div>
            <label className="label">Tiempo estimado (h)</label>
            <input type="number" step="0.5" {...register('estimatedHours')} placeholder="2" className="input" min="0" />
          </div>
          <div>
            <label className="label">Costo estimado</label>
            <input type="number" {...register('estimatedCost')} placeholder="150000" className="input" min="0" />
          </div>
          {isEdit && (
            <div>
              <label className="label text-brand-400 font-bold">Mano de Obra Real (COP)</label>
              <input type="number" {...register('laborCost')} placeholder="0" className="input border-brand-500/50 focus:border-brand-500" min="0" />
            </div>
          )}
        </div>

        <div>
          <label className="label">Reporte de daños / Observaciones de recepción</label>
          <textarea {...register('damageReport')} rows={3} className="input resize-none" placeholder="Descripción del estado de la moto al ingresar..." />
        </div>
        <div>
          <label className="label">Accesorios / Objetos recibidos</label>
          <textarea {...register('accessories')} rows={2} className="input resize-none" placeholder="Casco, guantes, documentos..." />
        </div>
        <div>
          <label className="label">Observaciones adicionales</label>
          <textarea {...register('observations')} rows={3} className="input resize-none" placeholder="Notas adicionales..." />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancelar</button>
          <button type="submit" disabled={isSubmitting} className="btn-primary gap-2">
            {isSubmitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            {isEdit ? 'Guardar cambios' : 'Crear servicio'}
          </button>
        </div>
      </motion.form>
    </div>
  )
}
