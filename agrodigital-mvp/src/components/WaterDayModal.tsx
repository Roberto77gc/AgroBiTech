import React, { useState, useEffect, useMemo, useRef } from 'react'
import { X } from 'lucide-react'
import { productAPI } from '../services/api'
import { useExportCsv } from '../hooks/useExportCsv'
import { useLastDay } from '../hooks/useLastDay'
import { useAutosaveDraft } from '../hooks/useAutosaveDraft'
import { getWithCache } from '../utils/cache'
import { formatCurrencyEUR } from '../utils/format'
import { convertAmount } from '../utils/units'
import type { DailyWaterRecord } from '../types'

interface WaterDayModalProps {
	isOpen: boolean
	onClose: () => void
	onSubmit: (dayData: DailyWaterRecord) => void
	existingDay?: DailyWaterRecord
	activityName: string
	isDarkMode: boolean
}

const WaterDayModal: React.FC<WaterDayModalProps> = ({
	isOpen,
	onClose,
	onSubmit,
	existingDay,
	activityName,
	isDarkMode
}) => {
    const [formData, setFormData] = useState<DailyWaterRecord>({
		date: '',
		consumption: 0,
		unit: 'L',
		cost: 0,
        notes: ''
	})
    const [waterPricePerUnit, setWaterPricePerUnit] = useState<number>(0)
    const [waterUnit, setWaterUnit] = useState<string>('m3')
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [errors, setErrors] = useState<{ [key: string]: string }>({})
    const storageKey = useMemo(() => `water:draft:${activityName || 'default'}`, [activityName])
    const draftReadyRef = useRef(false)

	useEffect(() => {
        if (isOpen) {
			loadWaterPrice()
			if (existingDay) {
				setFormData(existingDay)
			} else {
                setFormData({
                    date: new Date().toISOString().split('T')[0],
                    consumption: 0,
                    unit: 'm3',
                    cost: 0,
                    notes: ''
                })
			}
            // Restaurar borrador si existe
            draftReadyRef.current = false
            try {
                const raw = localStorage.getItem(storageKey)
                if (!existingDay && raw) {
                    const parsed = JSON.parse(raw)
                    if (parsed?.formData) setFormData(parsed.formData)
                }
            } catch {}
            finally { draftReadyRef.current = true }
		}
	}, [isOpen, existingDay, storageKey])

    useEffect(() => {
        // Recalcular coste cuando cambie consumo, unidades o precio con helper de conversión
        const qtyInProductUnit = convertAmount(Number(formData.consumption || 0), formData.unit as any, waterUnit as any)
        const cost = qtyInProductUnit * Number(waterPricePerUnit || 0)
        setFormData(prev => ({ ...prev, cost }))
    }, [formData.consumption, formData.unit, waterPricePerUnit, waterUnit])

    const loadWaterPrice = async () => {
        try {
            const cached = await getWithCache<any[]>(`cache:water:${activityName}`, async () => {
                const response = await productAPI.getByType('water')
                return response?.products || response || []
            }, (fresh) => {
                const p = Array.isArray(fresh) && fresh.length > 0 ? fresh[0] : null
                setWaterPricePerUnit(p?.pricePerUnit || 0)
                setWaterUnit(p?.unit || 'm3')
            })
            const p = Array.isArray(cached) && cached.length > 0 ? cached[0] : null
            if (p) { setWaterPricePerUnit(p.pricePerUnit || 0); setWaterUnit(p.unit || 'm3') }
        } catch (e) {
            setWaterPricePerUnit(0)
            setWaterUnit('m3')
        }
    }

	const handleInputChange = (field: keyof DailyWaterRecord, value: any) => {
		setFormData(prev => ({ ...prev, [field]: value }))
		if (errors[field]) {
			setErrors(prev => ({ ...prev, [field]: '' }))
		}
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setIsSubmitting(true)

		try {
			const newErrors: { [key: string]: string } = {}
			if (!formData.date) newErrors.date = 'La fecha es requerida'
			if (formData.consumption <= 0) newErrors.consumption = 'El consumo debe ser mayor a 0'
			if (Object.keys(newErrors).length > 0) {
				setErrors(newErrors)
				// Scroll al primer error
				const firstKey = Object.keys(newErrors)[0]
				const el = document.querySelector('[data-error-anchor="' + firstKey + '"]') as HTMLElement | null
				if (el && typeof el.scrollIntoView === 'function') {
					el.scrollIntoView({ behavior: 'smooth', block: 'center' })
				}
				return
			}
			// Asegurar coste consistente al guardar
            const qtyInProductUnit = convertAmount(Number(formData.consumption || 0), formData.unit as any, waterUnit as any)
            const updated = { ...formData, cost: qtyInProductUnit * Number(waterPricePerUnit || 0) }
            // Persistir "último día"
            try { localStorage.setItem(`water:last:${activityName}`, JSON.stringify({ formData: updated })) } catch {}
            saveLastDayToBackend({ formData: updated })
            // Limpiar borrador
            try { localStorage.removeItem(storageKey) } catch {}
			await onSubmit(updated)
			onClose()
		} catch (error) {
			console.error('Error submitting water day:', error)
		} finally {
			setIsSubmitting(false)
		}
	}

    // Autosave unificado
    useAutosaveDraft({ isOpen, isReadyRef: draftReadyRef, storageKey, payload: { formData }, delay: 500 })

    // Confirmación al cerrar con cambios no guardados y atajos
    const attemptClose = () => {
        try {
            const saved = localStorage.getItem(storageKey)
            const current = JSON.stringify({ formData })
            if (saved && saved !== current) {
                const confirmLeave = window.confirm('Tienes cambios no guardados. ¿Cerrar sin guardar?')
                if (!confirmLeave) return
            }
        } catch {}
        onClose()
    }
    useEffect(() => {
        if (!isOpen) return
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') { e.preventDefault(); attemptClose() }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'enter') {
                e.preventDefault()
                const form = document.getElementById('water-form') as HTMLFormElement | null
                if (form) form.requestSubmit()
            }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [isOpen])

    const { load: loadLast, save: saveLast } = useLastDay<{ formData: DailyWaterRecord }>(activityName, 'water')
    const applyLastDay = async () => {
        const payload = await loadLast()
        const src = payload?.formData
        if (!src) return
        const next: DailyWaterRecord = {
            date: new Date().toISOString().split('T')[0],
            consumption: Number(src.consumption || 0),
            unit: src.unit || 'm3',
            cost: 0,
            notes: src.notes || ''
        }
        setFormData(next)
    }

    const saveLastDayToBackend = async (payload: { formData: DailyWaterRecord }) => { try { await saveLast(payload as any) } catch {} }

    const { exportRows } = useExportCsv()
    const exportCsv = () => {
        try {
            const headers = ['Section','Name','Amount','Unit','Price','Cost','Notes','Date']
            const qtyInProductUnit = convertAmount(Number(formData.consumption || 0), formData.unit as any, waterUnit as any)
            const cost = qtyInProductUnit * Number(waterPricePerUnit || 0)
            const rows = [['Water','Water', qtyInProductUnit, waterUnit, waterPricePerUnit, cost, formData.notes || '', formData.date] as Array<string | number>]
            exportRows(`water_${activityName}_${formData.date}.csv`, headers, rows)
        } catch {}
    }

	const handleNumberFocus = (e: React.FocusEvent<HTMLInputElement>) => {
		if (e.target.value === '0') {
			e.target.value = ''
		}
	}

	if (!isOpen) return null

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div className={`w-full max-w-2xl rounded-xl shadow-xl transition-colors ${
				isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
			}`}>
				<div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
					<h2 className="text-xl font-bold">
						{existingDay ? 'Editar Día de Agua' : 'Añadir Día de Agua'}
					</h2>
						<div className="flex items-center gap-2">
							<button type="button" onClick={applyLastDay} className={`${isDarkMode ? 'bg-blue-700 hover:bg-blue-600 text-white' : 'bg-blue-100 hover:bg-blue-200 text-blue-800'} px-3 py-1 rounded-lg text-sm`}>Usar último día</button>
							<button onClick={attemptClose} className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
						<X className="h-5 w-5" />
							</button>
						</div>
				</div>

				<div className="p-6">
					<div className="mb-4">
						<p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
							Actividad: <span className="font-medium">{activityName}</span>
						</p>
					</div>

					<form id="water-form" onSubmit={handleSubmit} className="space-y-6">
						<div data-error-anchor="date">
							<label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
								Fecha del Día
							</label>
							<input type="date" value={formData.date} onChange={(e) => handleInputChange('date', e.target.value)} className={`w-full px-3 py-2 border rounded-lg transition-colors ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
							{errors.date && (<p className="text-red-500 text-sm mt-1">{errors.date}</p>)}
						</div>

                        <div>
							<label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
								Consumo de Agua
							</label>
							<div className="flex space-x-2">
                                <input type="number" step="0.01" min="0" value={formData.consumption} onChange={(e) => handleInputChange('consumption', parseFloat(e.target.value) || 0)} onFocus={handleNumberFocus} onKeyDown={(e) => { if (['e','E','+','-'].includes(e.key)) e.preventDefault() }} className={`flex-1 px-3 py-2 border rounded-lg transition-colors ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} placeholder="0" />
								<select value={formData.unit} onChange={(e) => handleInputChange('unit', e.target.value)} className={`px-3 py-2 border rounded-lg transition-colors ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                                    <option value="m3">m³</option>
                                    <option value="L">L</option>
								</select>
							</div>
							{errors.consumption && (<p className="text-red-500 text-sm mt-1">{errors.consumption}</p>)}
						</div>

						<div data-error-anchor="consumption">
							<label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
								Coste del Agua (auto)
							</label>
                            <input type="text" value={formatCurrencyEUR(Number(formData.cost))} readOnly className={`w-full px-3 py-2 border rounded-lg transition-colors ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
                            <p className="text-xs mt-1">Precio base: {formatCurrencyEUR(Number(waterPricePerUnit))}/{waterUnit}</p>
						</div>

						<div>
							<label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
								Notas del Día
							</label>
							<textarea value={formData.notes} onChange={(e) => handleInputChange('notes', e.target.value)} rows={3} className={`w-full px-3 py-2 border rounded-lg transition-colors ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} placeholder="Observaciones sobre el consumo de agua del día..." />
						</div>

						<div className="flex flex-wrap gap-3 justify-end pt-6 border-t border-gray-200 dark:border-gray-700 sticky bottom-0 bg-inherit pb-6">
                            <button type="button" onClick={exportCsv} className={`${isDarkMode ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'} px-3 py-2 rounded-lg text-sm`}>Exportar CSV</button>
							<button type="button" onClick={attemptClose} className={`px-4 py-2 border rounded-lg transition-colors ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>Cancelar (Esc)</button>
							<button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">{isSubmitting ? 'Guardando...' : (existingDay ? 'Actualizar Día' : 'Añadir Día')}</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	)
}

export default WaterDayModal
