import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import type { ProductPrice, DailyPhytosanitaryRecord as DailyPhytoTypesRecord, PhytosanitaryRecord as GlobalPhytosanitaryRecord } from '../types'
// import { convertAmount } from '../utils/units'
import { productAPI, templateAPI, inventoryAPI } from '../services/api'
import { productCache } from '../utils/cache'
import { useExportCsv } from '../hooks/useExportCsv'
import { useRecentProducts } from '../hooks/useRecentProducts'
import { useLastDay } from '../hooks/useLastDay'
import { useAutosaveDraft } from '../hooks/useAutosaveDraft'
import ProductSelect from './common/ProductSelect'
import TemplatesMenu from './common/TemplatesMenu'
import StockBadge from './common/StockBadge'
import EmptyState from './common/EmptyState'
// import { loadLastDay, saveLastDay } from '../utils/lastDay'
import { createPhytosanitaryTemplate } from '../domain/templates'
import { calculatePhytosanitaryTotals } from '../domain/costs'
import { formatCurrencyEUR } from '../utils/format'
import { unitPriceFor } from '../domain/validation'
import { useToast } from './ui/ToastProvider'
import { useNavigate } from 'react-router-dom'
import { exportDailyPdfLike } from '../utils/pdf'
import { validatePositiveNumberField, validateUnitForType } from '../utils/validation'

type PhytosanitaryRecord = GlobalPhytosanitaryRecord

// Alinear firma local con tipos globales
type DailyPhytosanitaryRecord = DailyPhytoTypesRecord

interface PhytosanitaryDayModalProps {
	isOpen: boolean
	onClose: () => void
	onSubmit: (dayData: DailyPhytosanitaryRecord) => void
	existingDay?: DailyPhytosanitaryRecord
	activityName: string
	isDarkMode: boolean
}

const PhytosanitaryDayModal: React.FC<PhytosanitaryDayModalProps> = ({
	isOpen,
	onClose,
	onSubmit,
	existingDay,
	activityName,
	isDarkMode
}) => {
	const [formData, setFormData] = useState<DailyPhytosanitaryRecord>({
		date: '',
		phytosanitaries: [],
		notes: '',
		totalCost: 0
	})

  const [availablePhytosanitaries, setAvailablePhytosanitaries] = useState<ProductPrice[]>([])
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [errors, setErrors] = useState<{ [key: string]: string }>({})
	const [ariaStatus, setAriaStatus] = useState<string>('')
  const [showTemplates, setShowTemplates] = useState(false)
  const [savedTemplates, setSavedTemplates] = useState<any[]>([])
  const [newTemplateName, setNewTemplateName] = useState('')
  // Edición de nombre ahora gestionada por TemplatesMenu
  const { success: toastSuccess, error: toastError, show: toastShow } = useToast()
  const navigate = useNavigate()
  // Búsqueda por fila / recientes / undo / autosave
  const [selectFilterTextByIndex, setSelectFilterTextByIndex] = useState<Record<number, string>>({})
  // Replaced by useRecentProducts
  const lastRemovedRef = useRef<{ index: number; record: PhytosanitaryRecord } | null>(null)
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false)
  const [inventoryLastSyncAt, setInventoryLastSyncAt] = useState<number | null>(null)
  const storageKey = useMemo(() => `phyto:draft:${activityName || 'default'}`, [activityName])
  const draftReadyRef = useRef(false)
  const headingRef = useRef<HTMLHeadingElement | null>(null)
  const modalRef = useRef<HTMLDivElement | null>(null)
  const preventInvalidNumberKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (['e', 'E', '+', '-'].includes(e.key)) {
      e.preventDefault()
    }
  }
  // Cache de stock por producto para validación inmediata
  const [stockByProduct, setStockByProduct] = useState<Record<string, { stock: number; unit: string; minStock?: number; criticalStock?: number }>>({})
  const scheduledInvIdsRef = useRef<Set<string>>(new Set())
  const invTimerRef = useRef<number | undefined>(undefined)
  const scheduleInventoryFetch = useCallback((productId: string) => {
    if (!productId) return
    scheduledInvIdsRef.current.add(productId)
    if (!invTimerRef.current) {
      // @ts-ignore
      invTimerRef.current = window.setTimeout(async () => {
        const ids = Array.from(scheduledInvIdsRef.current)
        scheduledInvIdsRef.current.clear()
        invTimerRef.current = undefined
        try {
          const mapRes = await inventoryAPI.getByProducts(ids)
          const itemsMap: Record<string, { _id: string; currentStock: number; unit: string }> = mapRes?.items || {}
          setStockByProduct(prev => {
            const next = { ...prev }
            for (const id of ids) {
              const it = itemsMap[id]
              next[id] = { stock: Number(it?.currentStock) || 0, unit: it?.unit || prev[id]?.unit || 'L' }
            }
            return next
          })
          setInventoryLastSyncAt(Date.now())
        } catch {}
      }, 150)
    }
  }, [])

  // Validación en tiempo real de stock para fitosanitarios
  useEffect(() => {
    const validateStock = async () => {
      try {
        const ids = formData.phytosanitaries.map(p => p.productId).filter(Boolean) as string[]
        if (ids.length === 0) return
        const mapRes = await inventoryAPI.getByProducts(Array.from(new Set(ids)))
        const itemsMap: Record<string, { _id: string; currentStock: number; unit: string }> = mapRes?.items || {}
        for (const p of formData.phytosanitaries) {
          if (!p.productId || (p.phytosanitaryAmount || 0) <= 0) continue
          const it = itemsMap[p.productId]
          if (it && p.phytosanitaryAmount > (it.currentStock || 0)) {
            toastError(`Stock insuficiente para ${p.phytosanitaryType}. Disponible: ${it.currentStock} ${it.unit}`)
            break
          }
        }
      } catch (_) {
        // silencioso
      }
    }
    validateStock()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.phytosanitaries])

	useEffect(() => {
		if (isOpen) {
      draftReadyRef.current = false
      loadData()
      loadSavedTemplates()
			if (existingDay) {
				setFormData(existingDay)
			} else {
				setFormData({
					date: new Date().toISOString().split('T')[0],
					phytosanitaries: [],
					notes: '',
					totalCost: 0
				})
			}
      // Restaurar borrador si existe
      try {
        const raw = localStorage.getItem(storageKey)
        if (!existingDay && raw) {
          const parsed = JSON.parse(raw)
          if (parsed?.formData) setFormData(parsed.formData)
        }
      } catch {}
      finally {
        draftReadyRef.current = true
      }
		}
  }, [isOpen, existingDay, storageKey])

  const loadData = async () => {
        try {
            const products = await productCache.get(`phytosanitary:${activityName}`, async () => {
                const res = await productAPI.getByType('phytosanitary')
                return res?.products || res || []
            })
            setAvailablePhytosanitaries(Array.isArray(products) ? products : [])
        } catch (error) {
            console.error('Error loading phytosanitaries:', error)
            setAvailablePhytosanitaries([])
        }
    }

  const handleInputChange = (field: keyof DailyPhytosanitaryRecord, value: any) => {
		setFormData(prev => ({ ...prev, [field]: value }))
		if (errors[field]) {
			setErrors(prev => ({ ...prev, [field]: '' }))
		}
	}

	const addPhytosanitary = () => {
		const newPhytosanitary: PhytosanitaryRecord = {
			productId: '',
			phytosanitaryType: '',
			phytosanitaryAmount: 0,
			phytosanitaryUnit: (() => { try { return localStorage.getItem('defaults:phytosanitaryUnit') || 'L' } catch { return 'L' } })(),
			price: 0,
			unit: 'L',
			brand: '',
			supplier: '',
			purchaseDate: '',
			cost: 0
		}
		setFormData(prev => ({
			...prev,
			phytosanitaries: [...prev.phytosanitaries, newPhytosanitary]
		}))
	}

  const updatePhytosanitary = (index: number, field: keyof PhytosanitaryRecord, value: any) => {
    setFormData(prev => ({
      ...prev,
      phytosanitaries: prev.phytosanitaries.map((phytosanitary, i) => 
        i === index ? { ...phytosanitary, [field]: value } : phytosanitary
      )
    }))
  }

  const loadSavedTemplates = async () => {
    try {
      setIsLoadingTemplates(true)
      const res = await templateAPI.list('phytosanitary')
      setSavedTemplates(Array.isArray(res?.templates) ? res.templates : [])
    } catch (e) {
      setSavedTemplates([])
    } finally { setIsLoadingTemplates(false) }
  }

  // Plantillas rápidas
  const applyTemplate = () => {
    const today = new Date().toISOString().split('T')[0]
    // Elegir el fitosanitario más barato si existe
    const list = [...(availablePhytosanitaries || [])]
      .filter(p => p.type === 'phytosanitary')
      .sort((a, b) => (a.pricePerUnit || 0) - (b.pricePerUnit || 0))

    const chosen = list[0]
    const tpl = createPhytosanitaryTemplate(today, {
      products: chosen
        ? [{
            productId: chosen._id,
            phytosanitaryType: chosen.name,
            phytosanitaryAmount: 0.25,
            phytosanitaryUnit: chosen.unit || 'L',
          }]
        : [],
      notes: 'Tratamiento básico',
    })
    setFormData({ ...tpl })
    setShowTemplates(false)
  }

  const applySavedTemplate = (tpl: any) => {
    const payload = tpl?.payload || {}
    const source: any = payload.formData || payload
    if (!source) return
    const next: DailyPhytosanitaryRecord = {
      date: source.date || new Date().toISOString().split('T')[0],
      phytosanitaries: source.phytosanitaries || [],
      notes: source.notes || '',
      totalCost: 0,
    }
    setFormData(next)
    setShowTemplates(false)
  }

    const saveCurrentAsTemplate = async () => {
    if (!newTemplateName.trim()) return
    const payload = { formData }
    try {
      await templateAPI.create({ name: newTemplateName.trim(), type: 'phytosanitary', payload })
      setNewTemplateName('')
      await loadSavedTemplates()
      toastSuccess('Plantilla guardada')
    } catch (e: any) {
      const msg = (e?.message || '').toString()
      if (msg.includes('409')) {
        toastError('Ya existe una plantilla con ese nombre')
      } else {
        console.error('Error guardando plantilla', e)
        toastError('No se pudo guardar la plantilla')
      }
    }
  }

  const updateTemplatePayload = async (tpl: any) => {
    try {
      const payload = { formData }
      await templateAPI.update(tpl._id, { name: tpl.name, payload })
      await loadSavedTemplates()
    } catch (e) {
      console.error('Error actualizando plantilla', e)
      toastError('No se pudo actualizar la plantilla')
    }
    toastSuccess('Plantilla actualizada')
  }

  // Último día: nube y local
  const applyLastDay = async () => {
    const payload = await loadLast()
    if (!payload?.formData) { toastError('No hay un día previo guardado'); return }
    const src = payload.formData as DailyPhytosanitaryRecord
    const next: DailyPhytosanitaryRecord = {
      date: new Date().toISOString().split('T')[0],
      phytosanitaries: src.phytosanitaries || [],
      notes: src.notes || '',
      totalCost: 0,
    }
    setFormData(next)
    setShowTemplates(false)
    toastSuccess('Se ha aplicado el último día')
  }

  const saveLastDayToBackend = async (payload: { formData: DailyPhytosanitaryRecord }) => {
    await saveLast(payload as any)
  }

  const startRenameTemplate = (_tpl: any) => {
    // Renombrado gestionado por TemplatesMenu; noop aquí
  }

  //

  const removePhytosanitary = (index: number) => {
    setFormData(prev => {
      const record = prev.phytosanitaries[index]
      lastRemovedRef.current = { index, record }
      toastShow('info', 'Producto eliminado', {
        actionLabel: 'Deshacer',
        onAction: () => {
          setFormData(p => {
            if (!lastRemovedRef.current) return p
            const { index: idx, record: rec } = lastRemovedRef.current
            const arr = [...p.phytosanitaries]
            arr.splice(idx, 0, rec)
            return { ...p, phytosanitaries: arr }
          })
          lastRemovedRef.current = null
        }
      })
      return { ...prev, phytosanitaries: prev.phytosanitaries.filter((_, i) => i !== index) }
    })
  }

  const duplicatePhytosanitary = (index: number) => {
    setFormData(prev => {
      const arr = [...prev.phytosanitaries]
      const src = arr[index]
      if (!src) return prev
      const copy = { ...src }
      arr.splice(index + 1, 0, copy)
      return { ...prev, phytosanitaries: arr }
    })
    toastSuccess('Línea duplicada')
  }

  // Autosave unificado
  useAutosaveDraft({
    isOpen,
    isReadyRef: draftReadyRef,
    storageKey,
    payload: { formData },
    delay: 500,
  })

  const attemptClose = useCallback(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      const current = JSON.stringify({ formData })
      if (saved && saved !== current) {
        const confirmLeave = window.confirm('Tienes cambios no guardados. ¿Cerrar sin guardar?')
        if (!confirmLeave) return
      }
    } catch {}
    onClose()
  }, [formData, onClose, storageKey])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); attemptClose() }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'enter') {
        e.preventDefault()
        const form = document.getElementById('phyto-form') as HTMLFormElement | null
        if (form) form.requestSubmit()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, attemptClose])

	// Foco inicial en el título al abrir
	useEffect(() => {
		if (!isOpen) return
		try { headingRef.current?.focus() } catch {}
	}, [isOpen])

	// Focus trap básico
	useEffect(() => {
		if (!isOpen) return
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key !== 'Tab') return
			const container = modalRef.current
			if (!container) return
			const focusable = container.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])')
			if (!focusable.length) return
			const first = focusable[0]
			const last = focusable[focusable.length - 1]
			const active = document.activeElement as HTMLElement | null
			if (e.shiftKey) {
				if (active === first) { e.preventDefault(); last.focus() }
			} else {
				if (active === last) { e.preventDefault(); first.focus() }
			}
		}
		window.addEventListener('keydown', onKeyDown)
		return () => window.removeEventListener('keydown', onKeyDown)
	}, [isOpen])

  const { recentProductIds, pushRecent } = useRecentProducts('phyto:recentProducts', 5)
  const { load: loadLast, save: saveLast } = useLastDay<any>(activityName, 'phytosanitary')

  const handlePhytosanitaryTypeChange = async (index: number, productId: string) => {
		if (!productId) return

		try {
			const product = availablePhytosanitaries.find(p => p._id === productId)
			if (product) {
				// Actualizar en un único set para evitar estados intermedios y recalcular total al instante
				setFormData(prev => {
					const nextPhytos = prev.phytosanitaries.map((ph, i) => i === index ? {
						...ph,
						productId,
						phytosanitaryType: product.name,
						price: unitPriceFor(productId, ph.price, availablePhytosanitaries),
						brand: product.brand || '',
						supplier: product.supplier || '',
						purchaseDate: product.purchaseDate || ''
					} : ph)
          const next = { ...prev, phytosanitaries: nextPhytos }
					const totals = calculatePhytosanitaryTotals(next, availablePhytosanitaries)
					return { ...next, totalCost: totals.total }
				})
        // Guardar recientes
        pushRecent(productId)
      }
    } catch (error) {
			console.error('Error loading product details:', error)
		}
  }
  const { exportRows } = useExportCsv()
  const onExportCsv = () => {
    try {
      const headers = ['Section','Name','Amount','Unit','Price','Cost','Notes','Date']
      const rows: Array<Array<string | number>> = []
      for (const p of formData.phytosanitaries) {
        const product = availablePhytosanitaries.find(x => x._id === p.productId)
        const unitPrice = Number(product?.pricePerUnit ?? p.price ?? 0)
        const unit = (product?.unit || p.unit || p.phytosanitaryUnit || 'L') as any
        const qty = Number(p.phytosanitaryAmount || 0)
        const cost = qty * unitPrice
        rows.push(['Phytosanitary', p.phytosanitaryType || (product?.name || ''), qty, unit, unitPrice, cost, formData.notes || '', formData.date])
      }
      const total = Number(calculateTotalCost())
      rows.push(['Total','Day total','','','', total, formData.notes || '', formData.date])
      exportRows(`phytosanitary_${activityName}_${formData.date}.csv`, headers, rows)
      toastSuccess('CSV exportado')
    } catch { toastError('No se pudo exportar el CSV') }
  }

  const onExportPdf = () => {
    try {
      const lines: string[] = []
      for (const p of formData.phytosanitaries) {
        const product = availablePhytosanitaries.find(x => x._id === p.productId)
        const unitPrice = Number(product?.pricePerUnit ?? p.price ?? 0)
        const unit = (product?.unit || p.unit || p.phytosanitaryUnit || 'L') as any
        const qty = Number(p.phytosanitaryAmount || 0)
        const cost = qty * unitPrice
        lines.push(`Fitosanitario: ${p.phytosanitaryType || (product?.name || '')} - ${qty} ${unit} x €${unitPrice.toFixed(4)} = €${cost.toFixed(2)}`)
      }
      				exportDailyPdfLike(formData.date, activityName, {
					phytosanitary: formData.phytosanitaries.map(p => ({
						phytosanitaryType: p.phytosanitaryType,
						phytosanitaryAmount: p.phytosanitaryAmount || 0,
						phytosanitaryUnit: p.unit || 'kg',
						cost: (p.phytosanitaryAmount || 0) * (p.price || 0)
					})),
					totalCost: formData.totalCost,
					notes: formData.notes
				})
    } catch {}
  }

  const calculateTotalCost = useCallback(() => {
    const { total } = calculatePhytosanitaryTotals(formData, availablePhytosanitaries)
    return total
  }, [formData, availablePhytosanitaries])

  // Recalcular coste total al cambiar productos o cantidades
  useEffect(() => {
    if (!isOpen) return
    setFormData(prev => ({ ...prev, totalCost: calculateTotalCost() }))
  }, [calculateTotalCost, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setIsSubmitting(true)

		try {
			const newErrors: { [key: string]: string } = {}
			
			if (!formData.date) {
				newErrors.date = 'La fecha es requerida'
			}
			
			if (formData.phytosanitaries.length === 0) {
				newErrors.phytosanitaries = 'Debe añadir al menos un fitosanitario'
			}

      if (Object.keys(newErrors).length > 0) {
				setErrors(newErrors)
				setAriaStatus('Hay errores de validación en el formulario')
        // Scroll al primer error
        const firstKey = Object.keys(newErrors)[0]
        const el = document.querySelector('[data-error-anchor="' + firstKey + '"]') as HTMLElement | null
        if (el && typeof el.scrollIntoView === 'function') {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
				return
			}

      // Confirmación si stock insuficiente en alguna línea
      let hasInsufficient = false
      for (let i = 0; i < formData.phytosanitaries.length; i++) {
        const p = formData.phytosanitaries[i]
        if (!p.productId || !p.phytosanitaryAmount) continue
        const info = stockByProduct[p.productId]
        if (!info) continue
        if (p.phytosanitaryAmount > (info.stock || 0)) { hasInsufficient = true; break }
      }
      if (hasInsufficient) {
        const ok = window.confirm('Hay líneas con stock insuficiente. ¿Confirmas guardar igualmente?')
        if (!ok) { setIsSubmitting(false); return }
      }

			const updatedFormData = {
				...formData,
				totalCost: calculateTotalCost(),
				phytosanitaries: formData.phytosanitaries.map(p => ({
					...p,
					cost: p.phytosanitaryAmount * (p.price || 0)
				}))
			}

      // Persistir "último día" local y subir a nube
      try { localStorage.setItem(`phyto:last:${activityName}`, JSON.stringify({ formData: updatedFormData })) } catch {}
      saveLastDayToBackend({ formData: updatedFormData as any })
      try { localStorage.removeItem(storageKey) } catch {}

      // Llamar a la función onSubmit que ahora conectará con el backend
			await onSubmit(updatedFormData)
			onClose()
			setAriaStatus('Día de fitosanitarios guardado correctamente')
		} catch (error) {
			console.error('Error submitting phytosanitary day:', error)
			setAriaStatus('Error al guardar el día de fitosanitarios')
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleNumberFocus = (e: React.FocusEvent<HTMLInputElement>) => {
		if (e.target.value === '0') {
			e.target.value = ''
		}
	}

  if (!isOpen) return (<></>)

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="phyto-modal-title" ref={modalRef}>
			<div className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl shadow-xl transition-colors ${
				isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
			}`}>
				<div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
					<h2 id="phyto-modal-title" ref={headingRef} tabIndex={-1} className="text-xl font-bold">
						{existingDay ? 'Editar Día de Fitosanitarios' : 'Añadir Día de Fitosanitarios'}
					</h2>
					<button onClick={onClose} aria-label="Cerrar" className={`p-2 rounded-lg transition-colors ${
						isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
					}`}>
						<X className="h-5 w-5" />
					</button>
				</div>

				{/* Screen reader announcements for aggregated errors and status */}
				<div className="sr-only" aria-live="polite">{[...Object.values(errors || {}).filter(Boolean), ariaStatus].filter(Boolean).join('. ')}</div>

				<div className="p-6">
					<div className="mb-4">
						<p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
							Actividad: <span className="font-medium">{activityName}</span>
						</p>
					</div>

					<form onSubmit={handleSubmit} className="space-y-6" aria-describedby="phyto-modal-title" aria-busy={isSubmitting}>
						<div>
							<label className={`block text-sm font-medium mb-2 ${
								isDarkMode ? 'text-gray-300' : 'text-gray-700'
							}`}>
								Fecha del Día
							</label>
							<input
								type="date"
								value={formData.date}
								onChange={(e) => handleInputChange('date', e.target.value)}
								className={`w-full px-3 py-2 border rounded-lg transition-colors ${
									isDarkMode 
										? 'bg-gray-700 border-gray-600 text-white' 
										: 'bg-white border-gray-300 text-gray-900'
								}`}
							/>
							{errors.date && (
								<p className="text-red-500 text-sm mt-1">{errors.date}</p>
							)}
						</div>

                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <label className={`text-sm font-medium ${
									isDarkMode ? 'text-gray-300' : 'text-gray-700'
								}`}>
									Fitosanitarios
								</label>
                                <div className="flex items-center gap-2 relative">
                                    <div className="relative">
                                        <button
                                            type="button"
                                            aria-haspopup="menu"
                                            aria-expanded={showTemplates ? true : false}
                                            aria-controls="phyto-templates-menu"
                                            onClick={() => setShowTemplates(v => !v)}
                                            className={`${isDarkMode ? 'bg-orange-700 text-white hover:bg-orange-600' : 'bg-orange-100 text-orange-800 hover:bg-orange-200'} px-3 py-1 rounded-lg text-sm`}
                                        >
                                            Usar Plantilla
                                        </button>
                                        {showTemplates && (
											<div id="phyto-templates-menu">
											<TemplatesMenu
												isDarkMode={isDarkMode}
												isLoading={isLoadingTemplates}
												savedTemplates={savedTemplates as any}
												onApplyLastDay={applyLastDay}
												onApplyQuick={() => applyTemplate()}
												onUseSaved={(tpl: any) => applySavedTemplate(tpl)}
												onUpdateSaved={(tpl: any) => updateTemplatePayload(tpl)}
												onRenameStart={(tpl: any) => startRenameTemplate(tpl)}
												onDelete={async (tpl: any) => { try { await templateAPI.delete(tpl._id); await loadSavedTemplates(); toastSuccess('Plantilla borrada') } catch { toastError('No se pudo borrar la plantilla') } }}
												newTemplateName={newTemplateName}
												onNewTemplateNameChange={setNewTemplateName}
												onSaveCurrentAsTemplate={saveCurrentAsTemplate}
											/>
											</div>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={addPhytosanitary}
                                        className="flex items-center space-x-2 px-3 py-1 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                                    >
                                        <Plus className="h-4 w-4" />
                                        <span>Añadir Fitosanitario</span>
                                    </button>
                                    </div>
                                    <div className="hidden md:flex items-center gap-2 ml-2 text-xs">
                                      {inventoryLastSyncAt && (
                                        <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                          Inventario sincronizado {new Date(inventoryLastSyncAt).toLocaleTimeString()}
                                        </span>
                                      )}
                                      <button
                                        type="button"
                                        onClick={async () => {
                                          try {
                                            const ids = Array.from(new Set(formData.phytosanitaries.map(p => p.productId).filter(Boolean))) as string[]
                                            if (ids.length === 0) return
                                            const mapRes = await inventoryAPI.getByProducts(ids)
                                            const itemsMap: Record<string, { _id: string; currentStock: number; unit: string }> = mapRes?.items || {}
                                            setStockByProduct(prev => {
                                              const next = { ...prev }
                                              for (const id of ids) {
                                                const it = itemsMap[id]
                                                next[id] = { stock: Number(it?.currentStock) || 0, unit: it?.unit || prev[id]?.unit || 'L' }
                                              }
                                              return next
                                            })
                                            setInventoryLastSyncAt(Date.now())
                                          } catch {}
                                        }}
                                        className={`${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'} px-2 py-1 rounded`}
                                      >Revalidar inventario</button>
                                    </div>
							</div>

                            {formData.phytosanitaries.length === 0 ? (
                                <EmptyState isDarkMode={isDarkMode} title="No hay fitosanitarios añadidos" subtitle={availablePhytosanitaries.length === 0 ? 'No hay fitosanitarios registrados. Ve a Gestión > Productos y Precios para añadir fitosanitarios.' : 'Haz clic en "Añadir Fitosanitario" para comenzar'} />
                            ) : (
								<div className="space-y-4">
									{formData.phytosanitaries.map((phytosanitary, index) => (
										<div key={index} className={`p-4 border rounded-lg transition-colors ${
											isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
										}`}>
											<div className="flex items-center justify-between mb-3">
												<h4 className="font-medium">Fitosanitario {index + 1}</h4>
                                                <div className="flex items-center gap-2">
                                                  <button
                                                      type="button"
                                                      onClick={() => removePhytosanitary(index)}
                                                      className="text-red-500 hover:text-red-700 transition-colors"
                                                  >
                                                      <Trash2 className="h-4 w-4" />
                                                  </button>
                                                  <button type="button" onClick={() => duplicatePhytosanitary(index)} className={`${isDarkMode ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'} px-2 py-1 rounded text-xs`}>Duplicar</button>
                                                </div>
											</div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
												<div>
													<label className={`block text-sm font-medium mb-2 ${
														isDarkMode ? 'text-gray-300' : 'text-gray-700'
													}`}>
                                                        Seleccionar Fitosanitario
													</label>
                                                    <ProductSelect
                                                        isDarkMode={isDarkMode}
                                                        indexKey={index}
                                                        value={phytosanitary.productId}
                                                        options={availablePhytosanitaries as any}
                                                        recentIds={recentProductIds}
                                                        filterText={selectFilterTextByIndex[index] || ''}
                                                        onFilterChange={(t) => setSelectFilterTextByIndex(prev => ({ ...prev, [index]: t }))}
                                                        onChange={async (productId) => {
                                                            await handlePhytosanitaryTypeChange(index, productId)
                                                            scheduleInventoryFetch(productId)
                                                        }}
                                                    />
												</div>

												<div>
													<label className={`block text-sm font-medium mb-2 ${
														isDarkMode ? 'text-gray-300' : 'text-gray-700'
													}`}>
														Cantidad
													</label>
													<div className="flex space-x-2">
														<input
															type="number"
															step="0.01"
															min="0"
															value={phytosanitary.phytosanitaryAmount}
															onChange={(e) => {
																const v = validatePositiveNumberField(e.target.value, Number(phytosanitary.phytosanitaryAmount || 0))
																if (v.error) {
																	setErrors(prev => ({ ...prev, [`phytosanitaryAmount_${index}`]: v.error as string }))
																	return
																}
																setErrors(prev => { const n: any = { ...prev }; delete n[`phytosanitaryAmount_${index}`]; return n })
																const value = Number(v.value)
																updatePhytosanitary(index, 'phytosanitaryAmount', value)
																const cached = stockByProduct[phytosanitary.productId || '']
																if (phytosanitary.productId && cached && value > (cached.stock || 0)) {
																	const path = `/inventario?productId=${phytosanitary.productId}`
																	toastShow('error', `Stock insuficiente para ${phytosanitary.phytosanitaryType || 'producto'}. Disponible: ${cached.stock} ${cached.unit || 'u'}`, {
																		actionLabel: 'Abrir inventario',
																		onAction: () => navigate(path),
																	})
																}
															}}
															onFocus={handleNumberFocus}
															onKeyDown={preventInvalidNumberKeys}
															className={`flex-1 px-3 py-2 border rounded-lg transition-colors ${
																isDarkMode 
																	? 'bg-gray-700 border-gray-600 text-white' 
																	: 'bg-white border-gray-300 text-gray-900'
															}`}
															aria-invalid={Boolean(errors[`phytosanitaryAmount_${index}`])}
															aria-describedby={errors[`phytosanitaryAmount_${index}`] ? `phytosanitaryAmount_${index}_error` : undefined}
														/>
                                                    <select
                                                        value={phytosanitary.unit || 'L'}
                                                        onChange={(e) => {
                                                          const u = e.target.value
                                                          const ok = validateUnitForType(u, ['L','ml','kg','g'])
                                                          if (!ok.ok) { setErrors(prev => ({ ...prev, [`phytosanitaryUnit_${index}`]: ok.message || 'Unidad inválida' })); return }
                                                          setErrors(prev => { const n: any = { ...prev }; delete n[`phytosanitaryUnit_${index}`]; return n })
                                                          updatePhytosanitary(index, 'unit', u)
                                                        }}
															className={`px-3 py-2 border rounded-lg transition-colors ${
																isDarkMode 
																	? 'bg-gray-700 border-gray-600 text-white' 
																	: 'bg-white border-gray-300 text-gray-900'
															}`}
														>
															<option value="L">L</option>
															<option value="ml">ml</option>
															<option value="kg">kg</option>
															<option value="g">g</option>
														</select>
                                                    {errors[`phytosanitaryAmount_${index}`] && (<p id={`phytosanitaryAmount_${index}_error`} className="text-red-500 text-sm mt-1">{errors[`phytosanitaryAmount_${index}`]}</p>)}
                                                    {errors[`phytosanitaryUnit_${index}`] && (<p className="text-red-500 text-sm mt-1">{errors[`phytosanitaryUnit_${index}`]}</p>)}
													</div>
												</div>
											</div>

                                            {phytosanitary.productId && (
												<div className="mt-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
													<div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
														<div>
															<span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
																Marca:
															</span> {phytosanitary.brand}
                                                    </div>
                                                    <div>
                                                        <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                            Proveedor:
                                                        </span> {phytosanitary.supplier || '—'}
                                                    </div>
														<div>
															<span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
																Precio:
                                                        </span> {formatCurrencyEUR(Number(availablePhytosanitaries.find(p => p._id === phytosanitary.productId)?.pricePerUnit ?? phytosanitary.price ?? 0))}/{phytosanitary.unit || 'L'}
														</div>
													</div>
													<div className="mt-2">
														<span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
															Coste:
                                                    </span> {formatCurrencyEUR(Number(phytosanitary.phytosanitaryAmount * ((availablePhytosanitaries.find(p => p._id === phytosanitary.productId)?.pricePerUnit ?? phytosanitary.price ?? 0))))}
													</div>
                                                    <StockBadge info={stockByProduct[phytosanitary.productId || '']} isDarkMode={isDarkMode} />
												</div>
											)}
										</div>
									))}
								</div>
							)}

							{errors.phytosanitaries && (
								<p className="text-red-500 text-sm mt-2">{errors.phytosanitaries}</p>
							)}
						</div>

						<div>
							<label className={`block text-sm font-medium mb-2 ${
								isDarkMode ? 'text-gray-300' : 'text-gray-700'
							}`}>
								Notas del Día
							</label>
							<textarea
								value={formData.notes}
								onChange={(e) => handleInputChange('notes', e.target.value)}
								rows={3}
								className={`w-full px-3 py-2 border rounded-lg transition-colors ${
									isDarkMode 
										? 'bg-gray-700 border-gray-600 text-white' 
										: 'bg-white border-gray-300 text-gray-900'
								}`}
								placeholder="Observaciones sobre la aplicación de fitosanitarios del día..."
							/>
						</div>

                        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
							<div className="flex justify-between items-center">
								<span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
									Coste Total del Día:
								</span>
                                <span className="text-lg font-bold text-orange-600">{formatCurrencyEUR(Number(calculateTotalCost()))}</span>
							</div>
						</div>

                        <div className="flex flex-wrap gap-3 justify-end pt-6 border-t border-gray-200 dark:border-gray-700 sticky bottom-0 bg-inherit pb-6">
                            <button type="button" onClick={() => { try { onExportCsv() } catch {} }} className={`${isDarkMode ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'} px-3 py-2 rounded-lg text-sm`}>Exportar CSV</button>
                            <button type="button" onClick={() => { try { onExportPdf() } catch {} }} className={`${isDarkMode ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'} px-3 py-2 rounded-lg text-sm`}>Exportar PDF</button>
							<button
								type="button"
                                onClick={attemptClose}
								className={`px-4 py-2 border rounded-lg transition-colors ${
									isDarkMode 
										? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
										: 'border-gray-300 text-gray-700 hover:bg-gray-50'
								}`}
							>
                                Cancelar (Esc)
							</button>
							<button
								type="submit"
								disabled={isSubmitting}
								className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
							>
								{isSubmitting ? 'Guardando...' : (existingDay ? 'Actualizar Día' : 'Añadir Día')}
							</button>
						</div>
					</form>
				</div>
            </div>
        </div>
    )
}

export default PhytosanitaryDayModal
