import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ClipboardList, Plus, Edit, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { checklistsApi } from '../../api/index'
import Modal from '../../components/ui/Modal'
import { useAuthStore } from '../../store/authStore'
import { useForm, useFieldArray } from 'react-hook-form'

const CATEGORIES = ['Motor', 'Suspensión', 'Frenos', 'Eléctrico', 'Chasis', 'Estética', 'General']

export default function ChecklistTemplates() {
  const qc = useQueryClient()
  const { hasMinRole } = useAuthStore()
  const [modal, setModal] = useState({ open: false, template: null })
  const [expanded, setExpanded] = useState({})

  const { data: templates, isLoading } = useQuery({
    queryKey: ['checklist-templates'],
    queryFn: () => checklistsApi.getTemplates().then(r => r.data.data),
  })

  const { register, handleSubmit, reset, control, formState: { isSubmitting } } = useForm({
    defaultValues: { name: '', motorcycleType: '', items: [{ category: 'Motor', label: '', isRequired: true }] }
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  const mutation = useMutation({
    mutationFn: (data) => modal.template ? checklistsApi.updateTemplate(modal.template.id, data) : checklistsApi.createTemplate(data),
    onSuccess: () => { toast.success('Plantilla guardada.'); qc.invalidateQueries(['checklist-templates']); setModal({ open: false, template: null }); reset() },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => checklistsApi.deleteTemplate(id),
    onSuccess: () => { toast.success('Plantilla desactivada.'); qc.invalidateQueries(['checklist-templates']) },
  })

  const openNew = () => { reset({ name: '', motorcycleType: '', items: [{ category: 'Motor', label: '', isRequired: true }] }); setModal({ open: true, template: null }) }
  const openEdit = (t) => { reset({ name: t.name, motorcycleType: t.motorcycleType || '', items: t.templateItems || [] }); setModal({ open: true, template: t }) }

  const toggleExpand = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2"><ClipboardList className="w-6 h-6 text-brand-400" />Plantillas de Checklist</h1>
          <p className="page-subtitle">Plantillas de inspección para servicios</p>
        </div>
        {hasMinRole('SUPERVISOR') && (
          <motion.button whileHover={{ scale: 1.02 }} onClick={openNew} className="btn-primary gap-2">
            <Plus className="w-4 h-4" /> Nueva Plantilla
          </motion.button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">{Array.from({length:3}).map((_,i)=><div key={i} className="card h-20 animate-pulse bg-dark-700" />)}</div>
      ) : (
        <div className="space-y-3">
          {templates?.map(t => (
            <div key={t.id} className="card overflow-hidden">
              <div className="flex items-center gap-4 p-5 cursor-pointer" onClick={() => toggleExpand(t.id)}>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <p className="font-semibold text-white">{t.name}</p>
                    {t.motorcycleType && <span className="badge-blue text-xs">{t.motorcycleType}</span>}
                    <span className="badge-orange text-xs">{t.templateItems?.length || 0} ítems</span>
                    <span className="badge-gray text-xs">{t._count?.checklists || 0} usos</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {hasMinRole('SUPERVISOR') && (
                    <>
                      <button onClick={e => { e.stopPropagation(); openEdit(t) }} className="btn-ghost btn-icon btn-sm"><Edit className="w-4 h-4" /></button>
                      <button onClick={e => { e.stopPropagation(); if (confirm('¿Desactivar plantilla?')) deleteMutation.mutate(t.id) }} className="btn-danger btn-icon btn-sm"><Trash2 className="w-4 h-4" /></button>
                    </>
                  )}
                  {expanded[t.id] ? <ChevronUp className="w-4 h-4 text-dark-400" /> : <ChevronDown className="w-4 h-4 text-dark-400" />}
                </div>
              </div>
              <AnimatePresence>
                {expanded[t.id] && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden border-t border-dark-700/40">
                    <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {t.templateItems?.map(item => (
                        <div key={item.id} className="flex items-center gap-2 p-2 rounded-lg bg-dark-700/40 text-sm">
                          <span className="badge-blue text-xs flex-shrink-0">{item.category}</span>
                          <span className="text-gray-300 truncate">{item.label}</span>
                          {item.isRequired && <span className="text-red-400 text-xs flex-shrink-0">*</span>}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
          {!templates?.length && <p className="text-dark-400 text-center py-12">No hay plantillas. Crea la primera.</p>}
        </div>
      )}

      <Modal open={modal.open} onClose={() => setModal({ open: false, template: null })}
        title={modal.template ? 'Editar Plantilla' : 'Nueva Plantilla'} size="lg">
        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Nombre de la plantilla *</label>
              <input {...register('name', { required: true })} className="input" placeholder="Inspección general MX" />
            </div>
            <div>
              <label className="label">Tipo de motocicleta</label>
              <input {...register('motorcycleType')} className="input" placeholder="250cc, 4T, Enduro..." />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="label mb-0">Ítems de inspección</label>
              <button type="button" onClick={() => append({ category: 'Motor', label: '', isRequired: false })} className="btn-secondary btn-sm gap-1">
                <Plus className="w-3 h-3" /> Agregar ítem
              </button>
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {fields.map((field, i) => (
                <div key={field.id} className="flex items-center gap-2 p-3 bg-dark-700/40 rounded-lg">
                  <select {...register(`items.${i}.category`)} className="input w-36 py-1.5 text-sm">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input {...register(`items.${i}.label`, { required: true })} placeholder="Descripción del ítem" className="input flex-1 py-1.5 text-sm" />
                  <label className="flex items-center gap-1 text-xs text-dark-400 flex-shrink-0 cursor-pointer">
                    <input type="checkbox" {...register(`items.${i}.isRequired`)} className="rounded" />
                    Req.
                  </label>
                  <button type="button" onClick={() => remove(i)} className="btn-danger btn-icon p-1 flex-shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModal({ open: false, template: null })} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Guardar plantilla'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
