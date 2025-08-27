import React, { useState, useEffect, useRef } from 'react'
import { X, Calendar, MapPin, Cloud, FileText, Euro, Tag, Leaf, Shield, Droplets, Package, Plus, Edit, Trash2, History, Download } from 'lucide-react'
import { exportDailyPdfLike } from '../utils/pdf'
import type { Activity, DailyFertigationRecord, DailyPhytosanitaryRecord, DailyWaterRecord } from '../types'
import FertigationDayModal from './FertigationDayModal'
import PhytosanitaryDayModal from './PhytosanitaryDayModal'
import WaterDayModal from './WaterDayModal'
import CostBreakdownModal from './CostBreakdownModal'
import InventoryMovementsModal from './InventoryMovementsModal'
import { activityAPI } from '../services/api'
import { formatCurrencyEUR } from '../utils/format'
import { useToast } from './ui/ToastProvider'

interface ActivityDetailModalProps {
	isOpen: boolean
	onClose: () => void
	activity: Activity
	isDarkMode: boolean
  onChanged?: () => void
}

const ActivityDetailModal: React.FC<ActivityDetailModalProps> = ({ 
	isOpen, 
	onClose, 
	activity, 
	isDarkMode,
  onChanged,
}) => {
	const [activityState, setActivityState] = useState<Activity>(activity)
	const [showFertigationDayModal, setShowFertigationDayModal] = useState(false)
  const [selectedDay, setSelectedDay] = useState<DailyFertigationRecord | undefined>(undefined)
  const [selectedFertigationIndex, setSelectedFertigationIndex] = useState<number | null>(null)
  const [showPhytosanitaryDayModal, setShowPhytosanitaryDayModal] = useState(false)
  const [selectedPhytoDay, setSelectedPhytoDay] = useState<DailyPhytosanitaryRecord | undefined>(undefined)
  const [selectedPhytoIndex, setSelectedPhytoIndex] = useState<number | null>(null)
  const { success: toastSuccess, error: toastError } = useToast()
  const [confirmState, setConfirmState] = useState<{ open: boolean; message: string; onConfirm: () => Promise<void> | void } | null>(null)
	const [showWaterDayModal, setShowWaterDayModal] = useState(false)
	const [selectedWaterDay, setSelectedWaterDay] = useState<DailyWaterRecord | undefined>(undefined)
	const [selectedWaterIndex, setSelectedWaterIndex] = useState<number | null>(null)
	const [showCostBreakdownModal, setShowCostBreakdownModal] = useState(false)
	const [costBreakdownData, setCostBreakdownData] = useState<any>(null)
  const [showMovementsModal, setShowMovementsModal] = useState(false)
  const headingRef = useRef<HTMLHeadingElement | null>(null)
  const modalRef = useRef<HTMLDivElement | null>(null)
	const confirmHeadingRef = useRef<HTMLHeadingElement | null>(null)
	const confirmModalRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!isOpen) return
    try { headingRef.current?.focus() } catch {}
  }, [isOpen])

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

	useEffect(() => {
		if (!isOpen) return
		const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); onClose() } }
		window.addEventListener('keydown', onKey)
		return () => window.removeEventListener('keydown', onKey)
	}, [isOpen, onClose])

	// Confirm dialog focus
	useEffect(() => {
		if (!confirmState?.open) return
		try { confirmHeadingRef.current?.focus() } catch {}
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key !== 'Tab') return
			const container = confirmModalRef.current
			if (!container) return
			const focusable = container.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
			if (!focusable.length) return
			const first = focusable[0]
			const last = focusable[focusable.length - 1]
			const active = document.activeElement as HTMLElement | null
			if (e.shiftKey) { if (active === first) { e.preventDefault(); last.focus() } } else { if (active === last) { e.preventDefault(); first.focus() } }
		}
		window.addEventListener('keydown', onKeyDown)
		return () => window.removeEventListener('keydown', onKeyDown)
	}, [confirmState])
  const notifyChanged = () => {
    try { onChanged?.() } catch {}
  }


  // Auto-ocultar toasts después de 2.5s
  // toasts globales: no necesitamos efecto de autocierre aquí

	const reloadActivity = async () => {
		try {
			const res = await activityAPI.getById(activity._id)
			if (res?.activity) setActivityState(res.activity)
		} catch (e) {
			console.error('Error reloading activity:', e)
		}
	}

	const getCropTypeColor = (cropType: string) => {
		const colors: { [key: string]: string } = {
			tomate: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
			pimiento: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
			pepino: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
			berenjena: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
			lechuga: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
			zanahoria: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
			patata: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
			cebolla: 'bg-white text-gray-800 dark:bg-gray-900 dark:text-gray-200',
			ajo: 'bg-white text-gray-800 dark:bg-gray-900 dark:text-gray-200',
			fresa: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
			uva: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
			olivo: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
			almendro: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
			cereales: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
			legumbres: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
			otro: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200'
		}
		return colors[cropType] || colors.otro
	}

	const formatDate = (date: Date | string) => {
		const dateObj = typeof date === 'string' ? new Date(date) : date
		return dateObj.toLocaleDateString('es-ES', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			weekday: 'long'
		})
	}

    const formatCurrency = (amount: number) => formatCurrencyEUR(Number(amount))

  const handleAddFertigationDay = () => {
    setSelectedDay(undefined)
    setSelectedFertigationIndex(null)
    setShowFertigationDayModal(true)
  }

  const handleEditFertigationDay = (day: DailyFertigationRecord, index: number) => {
    setSelectedDay(day)
    setSelectedFertigationIndex(index)
    setShowFertigationDayModal(true)
  }

  const handleDeleteFertigationDay = async (index: number) => {
    // Optimista: quitar visualmente mientras se procesa
    const prev = activityState
    const next = { ...activityState, fertigation: { ...activityState.fertigation!, dailyRecords: [...(activityState.fertigation?.dailyRecords || [])] } }
    next.fertigation!.dailyRecords.splice(index, 1)
    setActivityState(next as Activity)
    setConfirmState({
      open: true,
      message: '¿Estás seguro de eliminar este día de fertirriego?',
      onConfirm: async () => {
        try {
          const response = await activityAPI.deleteFertigationDay(activityState._id, index)
            if (response.success) {
            if (response?.activity) {
              setActivityState(response.activity)
            } else {
              await reloadActivity()
            }
            toastSuccess('Día de fertirriego eliminado correctamente')
              notifyChanged()
          } else {
            setActivityState(prev)
            toastError('No se pudo eliminar el día de fertirriego')
          }
        } catch (error) {
          console.error('Error eliminando día de fertirriego:', error)
          setActivityState(prev)
          toastError('Error al eliminar el día de fertirriego')
        }
      }
    })
  }

  const handleFertigationDaySubmit = async (dayData: DailyFertigationRecord) => {
    try {
      let response
      if (selectedFertigationIndex !== null) {
        response = await activityAPI.updateFertigationDay(activityState._id, selectedFertigationIndex, dayData)
      } else {
        response = await activityAPI.addFertigationDay(activityState._id, dayData)
      }
      if (!response.success) toastError('No se pudo guardar el día de fertirriego')
      // Ajuste de inventario ahora lo realiza el backend de forma atómica
      setShowFertigationDayModal(false)
      setSelectedDay(undefined)
      setSelectedFertigationIndex(null)
      // Actualizar UI inmediatamente: si el backend devuelve la actividad, úsala; si no, recargar
      if (response?.activity) {
        setActivityState(response.activity)
      } else {
        await reloadActivity()
      }
      const dayTotal = typeof (dayData as any).totalCost === 'number' ? (dayData as any).totalCost : undefined
      toastSuccess(`Día de fertirriego guardado${dayTotal != null ? ` · Total: ${formatCurrency(dayTotal)}` : ''}`)
      notifyChanged()
    } catch (error) {
      console.error('Error saving fertigation day:', error)
    }
  }

  const handleAddPhytosanitaryDay = () => {
    setSelectedPhytoDay(undefined)
    setSelectedPhytoIndex(null)
    setShowPhytosanitaryDayModal(true)
  }

  const handleDeletePhytosanitaryDay = async (index: number) => {
    const prev = activityState
    const next = { ...activityState, phytosanitary: { ...activityState.phytosanitary!, dailyRecords: [...(activityState.phytosanitary?.dailyRecords || [])] } }
    next.phytosanitary!.dailyRecords.splice(index, 1)
    setActivityState(next as Activity)
    setConfirmState({
      open: true,
      message: '¿Estás seguro de eliminar este día de fitosanitarios?',
      onConfirm: async () => {
        try {
          const response = await activityAPI.deletePhytosanitaryDay(activityState._id, index)
          if (response.success) {
            if (response?.activity) {
              setActivityState(response.activity)
            } else {
              await reloadActivity()
            }
            toastSuccess('Día de fitosanitarios eliminado correctamente')
            notifyChanged()
          } else {
            setActivityState(prev)
            toastError('No se pudo eliminar el día de fitosanitarios')
          }
        } catch (error) {
          console.error('Error eliminando día de fitosanitarios:', error)
          setActivityState(prev)
          toastError('Error al eliminar el día de fitosanitarios')
        }
      }
    })
  }

  const handlePhytosanitaryDaySubmit = async (dayData: any) => {
    try {
      let response
      if (selectedPhytoIndex !== null) {
        response = await activityAPI.updatePhytosanitaryDay(activityState._id, selectedPhytoIndex, dayData)
      } else {
        response = await activityAPI.addPhytosanitaryDay(activityState._id, dayData)
      }
      if (!response.success) toastError('No se pudo guardar el día de fitosanitarios')
      // Ajuste de inventario ahora lo realiza el backend de forma atómica
      setShowPhytosanitaryDayModal(false)
      setSelectedPhytoDay(undefined)
      setSelectedPhytoIndex(null)
      if (response?.activity) {
        setActivityState(response.activity)
      } else {
        await reloadActivity()
      }
      const phytoTotal = typeof (dayData as any).totalCost === 'number' ? (dayData as any).totalCost : undefined
      toastSuccess(`Día de fitosanitarios guardado${phytoTotal != null ? ` · Total: ${formatCurrency(phytoTotal)}` : ''}`)
      notifyChanged()
    } catch (error) {
      console.error('Error saving phytosanitary day:', error)
    }
  }

	const handleAddWaterDay = () => {
		setSelectedWaterDay(undefined)
		setSelectedWaterIndex(null)
		setShowWaterDayModal(true)
	}

	const handleEditWaterDay = (day: DailyWaterRecord, index: number) => {
		setSelectedWaterDay(day)
		setSelectedWaterIndex(index)
		setShowWaterDayModal(true)
	}

	const handleDeleteWaterDay = async (index: number) => {
    const prev = activityState
    const next = { ...activityState, water: { ...activityState.water!, dailyRecords: [...(activityState.water?.dailyRecords || [])] } }
    next.water!.dailyRecords.splice(index, 1)
    setActivityState(next as Activity)
    setConfirmState({
			open: true,
			message: '¿Estás seguro de eliminar este día de agua?',
			onConfirm: async () => {
				try {
					const response = await activityAPI.deleteWaterDay(activityState._id, index)
            if (response.success) {
              if (response?.activity) {
                setActivityState(response.activity)
              } else {
                await reloadActivity()
              }
              toastSuccess('Día de agua eliminado correctamente')
              notifyChanged()
            } else {
              setActivityState(prev)
              toastError('No se pudo eliminar el día de agua')
            }
				} catch (error) {
          console.error('Error eliminando día de agua:', error)
          setActivityState(prev)
          toastError('Error al eliminar el día de agua')
				}
			}
		})
	}

	const handleWaterDaySubmit = async (dayData: any) => {
		try {
			let response
			if (selectedWaterIndex !== null) {
				response = await activityAPI.updateWaterDay(activityState._id, selectedWaterIndex, dayData)
			} else {
				response = await activityAPI.addWaterDay(activityState._id, dayData)
			}
      if (!response.success) {
        toastError('No se pudo guardar el día de agua')
      }
			setShowWaterDayModal(false)
			setSelectedWaterDay(undefined)
      setSelectedWaterIndex(null)
      if (response?.activity) {
        setActivityState(response.activity)
      } else {
        await reloadActivity()
      }
      const waterTotal = typeof (dayData as any).cost === 'number' ? (dayData as any).cost : undefined
      toastSuccess(`Día de agua guardado${waterTotal != null ? ` · Total: ${formatCurrency(waterTotal)}` : ''}`)
      notifyChanged()
		} catch (error) {
      console.error('Error saving water day:', error)
      toastError('Error al guardar el día de agua')
		}
	}

	const handleShowCostBreakdown = (record: DailyFertigationRecord) => {
		const breakdownData = {
			fertilizers: record.fertilizers.map(f => ({
				name: f.fertilizerType,
				amount: f.fertilizerAmount,
				unit: f.unit || 'kg',
				price: f.price || 0,
				cost: f.fertilizerAmount * (f.price || 0)
			})),
			phytosanitaries: [],
			water: {
				consumption: record.waterConsumption,
				unit: record.waterUnit,
				price: 0,
				cost: 0
			},
			others: []
		}
		setCostBreakdownData(breakdownData)
		setShowCostBreakdownModal(true)
	}

	if (!isOpen) return null

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="activity-detail-title" ref={modalRef}>
			{/* Overlay */}
			<div 
				className="absolute inset-0 bg-black bg-opacity-50"
				onClick={onClose}
			/>
			
			{/* Modal */}
			<div className={`relative w-full max-w-4xl mx-4 rounded-xl shadow-2xl transition-colors ${
				isDarkMode ? 'bg-gray-800' : 'bg-white'
			}`}>
				{/* Header */}
                <div className={`flex items-center justify-between p-6 border-b ${
					isDarkMode ? 'border-gray-700' : 'border-gray-200'
				}`}>
					<div className="flex items-center space-x-3">
						<span className={`px-3 py-1 text-sm font-medium rounded-full ${getCropTypeColor(activityState.cropType)}`}>
							{activityState.cropType.charAt(0).toUpperCase() + activityState.cropType.slice(1)}
						</span>
						<h2 id="activity-detail-title" ref={headingRef} tabIndex={-1} className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
							{activityState.name}
						</h2>
					</div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          try {
                            const summary = {
                              name: activityState.name,
                              cropType: activityState.cropType,
                              area: `${activityState.area} ${activityState.areaUnit}`,
                              totals: {
                                fertigation: (activityState.fertigation?.dailyRecords || []).reduce((s, r) => s + Number(r.totalCost || 0), 0),
                                phytosanitary: (activityState.phytosanitary?.dailyRecords || []).reduce((s, r) => s + Number(r.totalCost || 0), 0),
                                water: (activityState.water?.dailyRecords || []).reduce((s, r) => s + Number(r.cost || 0), 0),
                              },
                              totalCost: activityState.totalCost,
                              notes: activityState.notes || '',
                            }
                            exportDailyPdfLike(new Date().toISOString().split('T')[0], activityState.cropType || 'Actividad', summary)
                          } catch (e) { console.error('Export error', e) }
                        }}
                        className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                      >
                        <Download className="w-4 h-4" />
                        Exportar informe
                      </button>
                      <button
                        onClick={() => setShowMovementsModal(true)}
                        className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                      >
                        <History className="w-4 h-4" />
                        Ver movimientos
                      </button>
                    <button
						onClick={onClose}
						aria-label="Cerrar"
						className={`p-2 rounded-lg transition-colors ${
							isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
						}`}
					>
						<X className="h-5 w-5" />
					</button>
                    </div>
				</div>

				{/* SR announcements */}
				<div className="sr-only" aria-live="polite"></div>

				{/* Content */}
				<div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
					{/* Información Básica */}
					<div>
						<h3 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
							Información Básica
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="flex items-center space-x-3">
								<div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
									<Tag className="h-5 w-5 text-blue-500" />
								</div>
								<div>
									<p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
										Tipo de Cultivo
									</p>
									<p className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
										{activityState.cropType.charAt(0).toUpperCase() + activityState.cropType.slice(1)}
									</p>
								</div>
							</div>

							{activityState.plantCount && activityState.plantCount > 0 && (
								<div className="flex items-center space-x-3">
									<div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
										<Leaf className="h-5 w-5 text-green-500" />
									</div>
									<div>
										<p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
											Número de Plantas
										</p>
										<p className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
											{activityState.plantCount.toLocaleString()}
										</p>
									</div>
								</div>
							)}

							<div className="flex items-center space-x-3">
								<div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
									<MapPin className="h-5 w-5 text-red-500" />
								</div>
								<div>
									<p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
										Extensión
									</p>
									<p className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
										{activityState.area} {activityState.areaUnit}
									</p>
								</div>
							</div>

							{activityState.transplantDate && (
								<div className="flex items-center space-x-3">
									<div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
										<Calendar className="h-5 w-5 text-blue-500" />
									</div>
									<div>
										<p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
											Fecha de Transplante
										</p>
										<p className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
											{formatDate(activityState.transplantDate)}
										</p>
									</div>
								</div>
							)}
						</div>
					</div>

					{/* Gestión de Recursos */}
					<div className="space-y-6">
						<h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
							Gestión de Recursos
						</h3>

						{/* Fertirriego */}
						<div className={`p-4 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
							<div className="flex items-center justify-between mb-4">
								<div className="flex items-center space-x-2">
									<div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
										<Leaf className="w-4 h-4 text-green-600 dark:text-green-400" />
									</div>
									<h4 className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
										Fertirriego - Registro Diario
									</h4>
								</div>
								<button
									onClick={handleAddFertigationDay}
									className="flex items-center space-x-2 px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
								>
									<Plus className="h-4 w-4" />
									<span>Añadir Día</span>
								</button>
							</div>

							{activityState.fertigation?.dailyRecords && activityState.fertigation.dailyRecords.length > 0 ? (
								<div className="space-y-3">
									{activityState.fertigation.dailyRecords.map((record, index) => (
										<div
											key={index}
											className={`p-3 border rounded-lg ${isDarkMode ? 'bg-gray-600 border-gray-500' : 'bg-white border-gray-200'}`}
										>
											<div className="flex items-center justify-between mb-2">
												<span className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
													{new Date(record.date).toLocaleDateString('es-ES')} - {record.fertilizers.length} fertilizante(s)
												</span>
												<div className="flex space-x-2">
                                                  <button
                                                    onClick={() => handleEditFertigationDay(record, index)}
														className="text-blue-500 hover:text-blue-700 transition-colors"
													>
														<Edit className="h-4 w-4" />
													</button>
													<button
														onClick={() => handleDeleteFertigationDay(index)}
														className="text-red-500 hover:text-red-700 transition-colors"
													>
														<Trash2 className="h-4 w-4" />
													</button>
													<button
														onClick={() => handleShowCostBreakdown(record)}
														className="text-purple-500 hover:text-purple-700 transition-colors"
													>
														<Euro className="h-4 w-4" />
													</button>
												</div>
											</div>
											{record.fertilizers.map((fertilizer, fIndex) => (
												<div key={fIndex} className="ml-4 mb-2">
													<div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
														<strong>Fertilizante {fIndex + 1}:</strong> {fertilizer.fertilizerType} - {fertilizer.fertilizerAmount} {fertilizer.fertilizerUnit}
													</div>
													{fertilizer.brand && (
                                                        <div className={`text-xs ml-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                            Marca: {fertilizer.brand} | Proveedor: {fertilizer.supplier} | Coste: {formatCurrency(Number(fertilizer.fertilizerAmount * (fertilizer.price || 0)))}
                                                        </div>
													)}
												</div>
											))}
											{record.waterConsumption > 0 && (
												<div className={`text-sm ml-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
													<strong>Agua:</strong> {record.waterConsumption} {record.waterUnit}
												</div>
											)}
											{record.notes && (
												<div className={`text-sm ml-4 mt-2 italic ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
													"{record.notes}"
												</div>
											)}
										</div>
									))}
								</div>
							) : (
								<p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
									No hay registros de fertirriego
								</p>
							)}
						</div>

						{/* Fitosanitarios */}
						<div className={`p-4 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
							<div className="flex items-center justify-between mb-4">
								<div className="flex items-center space-x-2">
									<div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
										<Shield className="w-4 h-4 text-orange-600 dark:text-orange-400" />
									</div>
									<h4 className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
										Fitosanitarios - Registro Diario
									</h4>
								</div>
								<button
									onClick={handleAddPhytosanitaryDay}
									className="flex items-center space-x-2 px-3 py-1 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
								>
									<Plus className="h-4 w-4" />
									<span>Añadir Día</span>
								</button>
							</div>

							{activityState.phytosanitary?.dailyRecords && activityState.phytosanitary.dailyRecords.length > 0 ? (
								<div className="space-y-3">
									{activityState.phytosanitary.dailyRecords.map((record, index) => (
										<div
											key={index}
											className={`p-3 border rounded-lg ${isDarkMode ? 'bg-gray-600 border-gray-500' : 'bg-white border-gray-200'}`}
										>
											<div className="flex items-center justify-between mb-2">
												<span className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
													{new Date(record.date).toLocaleDateString('es-ES')} - {record.phytosanitaries.length} producto(s)
												</span>
												<div className="flex space-x-2">
                                                  <button
                                                    onClick={() => { setSelectedPhytoDay(record as unknown as DailyPhytosanitaryRecord); setSelectedPhytoIndex(index); setShowPhytosanitaryDayModal(true) }}
														className="text-blue-500 hover:text-blue-700 transition-colors"
													>
														<Edit className="h-4 w-4" />
													</button>
													<button
														onClick={() => handleDeletePhytosanitaryDay(index)}
														className="text-red-500 hover:text-red-700 transition-colors"
													>
														<Trash2 className="h-4 w-4" />
													</button>
												</div>
											</div>
											{record.phytosanitaries.map((product, pIndex) => (
												<div key={pIndex} className="ml-4 mb-2">
													<div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
														<strong>Producto {pIndex + 1}:</strong> {product.phytosanitaryType} - {product.phytosanitaryAmount} {product.phytosanitaryUnit}
													</div>
												</div>
											))}
											{record.notes && (
												<div className={`text-sm ml-4 mt-2 italic ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
													"{record.notes}"
												</div>
											)}
										</div>
									))}
								</div>
							) : (
								<p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
									No hay registros de fitosanitarios
								</p>
							)}
						</div>

						{/* Agua */}
						<div className={`p-4 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
							<div className="flex items-center justify-between mb-4">
								<div className="flex items-center space-x-2">
									<div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
										<Droplets className="w-4 h-4 text-blue-600 dark:text-blue-400" />
									</div>
									<h4 className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
										Agua - Consumo Diario
									</h4>
								</div>
								<button
									onClick={handleAddWaterDay}
									className="flex items-center space-x-2 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
								>
									<Plus className="h-4 w-4" />
									<span>Añadir Día</span>
								</button>
							</div>

					{activityState.water?.dailyRecords && activityState.water.dailyRecords.length > 0 ? (
						<div className="space-y-3">
							{activityState.water.dailyRecords.map((record, index) => (
								<div key={index} className={`p-3 border rounded-lg ${isDarkMode ? 'bg-gray-600 border-gray-500' : 'bg-white border-gray-200'}`}>
									<div className="flex items-center justify-between mb-2">
										<span className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
											{record.date ? new Date(record.date).toLocaleDateString('es-ES') + ' - ' : ''}
											Consumo: {record.consumption} {record.unit}
										</span>
										<div className="flex space-x-2">
											<button onClick={() => handleEditWaterDay(record as unknown as DailyWaterRecord, index)} className="text-blue-500 hover:text-blue-700 transition-colors">
												<Edit className="h-4 w-4" />
											</button>
											<button onClick={() => handleDeleteWaterDay(index)} className="text-red-500 hover:text-red-700 transition-colors">
												<Trash2 className="h-4 w-4" />
											</button>
										</div>
									</div>
									{record.cost > 0 && (
										<div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
											<strong>Coste:</strong> {formatCurrency(Number(record.cost))}
										</div>
									)}
								</div>
							))}
						</div>
					) : (
								<p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
									No hay registros de consumo de agua
								</p>
							)}
						</div>
					</div>

					{/* Fotos */}
					{activityState.photos && activityState.photos.length > 0 && (
						<div>
							<h3 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
								Fotografías
							</h3>
							<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
								{activityState.photos.map((photo, index) => (
									<div key={index} className="relative">
										<img
											src={photo}
											alt={`Foto ${index + 1}`}
											className="w-full h-32 object-cover rounded-lg"
										/>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Información adicional */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						{/* Fecha y Coste */}
						<div className="space-y-4">
							<div className="flex items-center space-x-3">
								<div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
									<Calendar className="h-5 w-5 text-blue-500" />
								</div>
								<div>
									<p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
										Fecha de Creación
									</p>
									<p className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
										{formatDate(activityState.createdAt)}
									</p>
								</div>
							</div>

							<div className="flex items-center space-x-3">
								<div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
									<Euro className="h-5 w-5 text-green-500" />
								</div>
								<div>
									<p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
										Coste Total
									</p>
									<p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
										{formatCurrency(activityState.totalCost)}
									</p>
								</div>
							</div>
						</div>

						{/* Ubicación y Clima */}
						<div className="space-y-4">
							{activityState.location && (
								<div className="flex items-center space-x-3">
									<div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
										<MapPin className="h-5 w-5 text-red-500" />
									</div>
									<div>
										<p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
											Ubicación
										</p>
										<p className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
											            📍 Lat: {activityState.location?.lat}, Lng: {activityState.location?.lng}
										</p>
									</div>
								</div>
							)}

							{activityState.weather && (
								<div className="flex items-center space-x-3">
									<div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
										<Cloud className="h-5 w-5 text-cyan-500" />
									</div>
									<div>
										<p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
											Clima
										</p>
										<p className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
											{activityState.weather}
										</p>
									</div>
								</div>
							)}
						</div>
					</div>

					{/* Productos Consumidos */}
					{activityState.consumedProducts && activityState.consumedProducts.length > 0 && (
						<div>
							<h3 className={`text-lg font-semibold mb-3 flex items-center space-x-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
								<Package className="h-5 w-5 text-blue-600" />
								<span>Productos Consumidos del Inventario</span>
							</h3>
							<div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
								<div className="space-y-3">
									{activityState.consumedProducts.map((product, index) => (
										<div key={index} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-600">
											<div className="flex items-center space-x-3">
												<div className={`p-2 rounded-lg ${isDarkMode ? 'bg-blue-900' : 'bg-blue-100'}`}>
													<Package className="h-4 w-4 text-blue-600" />
												</div>
												<div>
													<p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
														{product.productName}
													</p>
													<p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
														Consumido: {product.amount} {product.unit}
													</p>
												</div>
											</div>
										</div>
									))}
								</div>
							</div>
						</div>
					)}

					{/* Notas */}
					{activityState.notes && (
						<div>
							<h3 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
								Observaciones Generales
							</h3>
							<div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
								<div className="flex items-start space-x-3">
									<FileText className="h-5 w-5 text-gray-400 mt-0.5" />
									<p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
										{activityState.notes}
									</p>
								</div>
							</div>
						</div>
					)}

					{/* Información del sistema */}
					<div className={`pt-6 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
							<div>
								<p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
									Creado: {formatDate(activityState.createdAt)}
								</p>
							</div>
							<div>
								<p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
									Actualizado: {formatDate(activityState.updatedAt)}
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* Footer */}
				<div className={`flex items-center justify-end p-6 border-t ${
					isDarkMode ? 'border-gray-700' : 'border-gray-200'
				}`}>
					<button
						onClick={onClose}
						className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
					>
						Cerrar
					</button>
				</div>

				{/* Fertigation Day Modal */}
				{showFertigationDayModal && (
					<FertigationDayModal
						isOpen={showFertigationDayModal}
						onClose={() => {
							setShowFertigationDayModal(false)
							setSelectedDay(undefined)
						}}
						onSubmit={handleFertigationDaySubmit}
						existingDay={selectedDay}
						activityName={activityState.cropType || 'Actividad'}
						isDarkMode={isDarkMode}
					/>
				)}

				{/* Phytosanitary Day Modal */}
          {showPhytosanitaryDayModal && (
					<PhytosanitaryDayModal
						isOpen={showPhytosanitaryDayModal}
              onClose={() => setShowPhytosanitaryDayModal(false)}
              existingDay={selectedPhytoDay}
						activityName={activityState.cropType || 'Actividad'}
						isDarkMode={isDarkMode}
						onSubmit={handlePhytosanitaryDaySubmit}
					/>
				)}

				{/* Water Day Modal */}
				{showWaterDayModal && (
					<WaterDayModal
						isOpen={showWaterDayModal}
						onClose={() => {
							setShowWaterDayModal(false)
							setSelectedWaterDay(undefined)
							setSelectedWaterIndex(null)
						}}
						existingDay={selectedWaterDay}
						activityName={activityState.cropType || 'Actividad'}
						isDarkMode={isDarkMode}
						onSubmit={handleWaterDaySubmit}
					/>
				)}

				{/* Cost Breakdown Modal */}
				{showCostBreakdownModal && costBreakdownData && (
					<CostBreakdownModal
						isOpen={showCostBreakdownModal}
						onClose={() => setShowCostBreakdownModal(false)}
						activityName={activityState.cropType || 'Actividad'}
						date={new Date().toISOString().split('T')[0]}
						costs={costBreakdownData}
						isDarkMode={isDarkMode}
					/>
				)}

        {/* Inventory Movements Modal */}
        {showMovementsModal && (
          <InventoryMovementsModal
            isOpen={showMovementsModal}
            onClose={() => setShowMovementsModal(false)}
            activityId={activityState._id}
            isDarkMode={isDarkMode}
          />
        )}
        

        {/* Confirm Dialog */}
        {confirmState?.open && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title" ref={confirmModalRef}>
            <div className={`w-full max-w-md rounded-xl p-6 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`} ref={confirmHeadingRef}>
              <h3 id="confirm-dialog-title" ref={confirmHeadingRef} tabIndex={-1} className="text-lg font-semibold mb-2">Confirmación</h3>
              <p className="mb-4">{confirmState.message}</p>
              <div className="flex justify-end space-x-2">
                <button onClick={() => setConfirmState(null)} className={`px-4 py-2 rounded ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}>Cancelar</button>
                <button onClick={async () => { await confirmState.onConfirm(); setConfirmState(null) }} className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700">Eliminar</button>
              </div>
            </div>
          </div>
        )}
      </div>
		</div>
	)
}

export default ActivityDetailModal 