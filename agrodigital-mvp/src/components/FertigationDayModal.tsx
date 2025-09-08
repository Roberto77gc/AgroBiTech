import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import type { DailyFertigationRecord, FertilizerRecord, ProductPrice, OtherExpenseRecord } from '../types'
import { productAPI, inventoryAPI, purchaseAPI, templateAPI } from '../services/api'
import { productCache } from '../utils/cache'
import { useKpis } from '../hooks/useKpis'
import { useExportCsv } from '../hooks/useExportCsv'
import { useRecentProducts } from '../hooks/useRecentProducts'
import { useAutosaveDraft } from '../hooks/useAutosaveDraft'
// useOfflineMode import removed as it's not being used
import ProductSelect from './common/ProductSelect'
import TemplatesMenu from './common/TemplatesMenu'
import StockBadge from './common/StockBadge'
import KpiPanel from './common/KpiPanel'
import EmptyState from './common/EmptyState'
//
import { loadLastDay, saveLastDay } from '../utils/lastDay'
import CostBreakdownModal from './CostBreakdownModal'
import { calculateFertigationTotals } from '../domain/costs'
import { formatCurrencyEUR } from '../utils/format'
import { convertAmount } from '../utils/units'
import { unitPriceFor } from '../domain/validation'
import { createFertigationTemplate } from '../domain/templates'
import OtherExpensesModal from './OtherExpensesModal'
import { exportDailyPdfLike } from '../utils/pdf'
import { useToast } from './ui/ToastProvider'
import { useNavigate } from 'react-router-dom'
import { validatePositiveNumberField, validateUnitForType } from '../utils/validation'
import PurchaseRegistrationModal from './PurchaseRegistrationModal'

interface FertigationDayModalProps {
	isOpen: boolean
	onClose: () => void
	onSubmit: (dayData: DailyFertigationRecord) => void
	existingDay?: DailyFertigationRecord
	activityName: string
	isDarkMode: boolean
}

const FertigationDayModal: React.FC<FertigationDayModalProps> = ({
	isOpen,
	onClose,
	onSubmit,
	existingDay,
	activityName,
	isDarkMode
}) => {
    const preventInvalidNumberKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (['e', 'E', '+', '-'].includes(e.key)) {
            e.preventDefault()
        }
    }
	const [formData, setFormData] = useState<DailyFertigationRecord>({
		date: '',
		fertilizers: [],
		waterConsumption: 0,
		waterUnit: 'm3',
		notes: '',
		totalCost: 0
	})

	const [availableFertilizers, setAvailableFertilizers] = useState<ProductPrice[]>([])
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [errors, setErrors] = useState<{ [key: string]: string }>({})
	const [ariaStatus, setAriaStatus] = useState<string>('')
	const [showCostBreakdown, setShowCostBreakdown] = useState(false)
	const [costBreakdownData, setCostBreakdownData] = useState<any>(null)
	const [showOtherExpensesModal, setShowOtherExpensesModal] = useState(false)
	const [otherExpenses, setOtherExpenses] = useState<OtherExpenseRecord[]>([])
    const [showTemplates, setShowTemplates] = useState(false)
    const [savedTemplates, setSavedTemplates] = useState<any[]>([])
    const [newTemplateName, setNewTemplateName] = useState('')
    // Edición de nombre ahora gestionada por TemplatesMenu
    // Búsqueda por fila y undo eliminación
    const [selectFilterTextByIndex, setSelectFilterTextByIndex] = useState<Record<number, string>>({})
    const lastRemovedRef = useRef<{ index: number; record: FertilizerRecord } | null>(null)
    // Productos recientes (se persisten en localStorage al seleccionar). Si no se usan en UI, no declaramos estado para evitar warnings.
    const [isLoadingTemplates, setIsLoadingTemplates] = useState(false)
    const [inventoryLastSyncAt, setInventoryLastSyncAt] = useState<number | null>(null)
    const dateInputRef = useRef<HTMLInputElement | null>(null)
    const headingRef = useRef<HTMLHeadingElement | null>(null)
    const modalRef = useRef<HTMLDivElement | null>(null)
    // Borrador y autosave
    const storageKey = useMemo(() => `fertigation:draft:${activityName || 'default'}`, [activityName])
    const draftReadyRef = useRef(false)
    const scheduledInvIdsRef = useRef<Set<string>>(new Set())
    const invTimerRef = useRef<number | undefined>(undefined)
    const [showPurchaseModal, setShowPurchaseModal] = useState(false)
    // Cache local de stock por producto para validación inmediata
	const [stockByProduct, setStockByProduct] = useState<Record<string, { stock: number; unit: string; minStock?: number; criticalStock?: number }>>({})
    const { success: toastSuccess, error: toastError, show: toastShow } = useToast()
    const navigate = useNavigate()
    	// offlineMode hook removed as it's not being used

    // Memo: mapas y listas derivadas para rendimiento
	const productById = useMemo(() => {
		const map = new Map<string, ProductPrice>()
		for (const p of availableFertilizers) map.set(p._id, p)
		return map
	}, [availableFertilizers])
    // Productos recientes para priorizar en el selector
    const { recentProductIds, pushRecent } = useRecentProducts('fertigation:recentProducts', 5)
	// KPIs configurables por actividad (persisten en localStorage)
    const { kpiAreaHa, kpiPlants, setKpiAreaHa, setKpiPlants } = useKpis(activityName)
	// Nota: reservado para futuras mejoras (listados/validaciones)

	// Sanitizar números: evita NaN, negativos y valores extremos
	const sanitizeNumber = useCallback((raw: string): number => {
		let text = (raw || '').replace(',', '.')
		let n = parseFloat(text)
		if (!isFinite(n) || n < 0) n = 0
		if (n > 1_000_000_000) n = 1_000_000_000
		return Math.round(n * 1000) / 1000
	}, [])

    // Validación en tiempo real de stock para fertilizantes
    useEffect(() => {
        const validateStock = async () => {
            try {
                const ids = formData.fertilizers.map(f => f.productId).filter(Boolean) as string[]
                if (ids.length === 0) return
                const mapRes = await inventoryAPI.getByProducts(Array.from(new Set(ids)))
                const itemsMap: Record<string, { _id: string; currentStock: number; unit: string }> = mapRes?.items || {}
                for (const f of formData.fertilizers) {
                    if (!f.productId || (f.fertilizerAmount || 0) <= 0) continue
                    const it = itemsMap[f.productId]
                    if (it) {
                        const enteredInStockUnit = convertAmount(Number(f.fertilizerAmount || 0), (f.unit as any) || 'kg', (it.unit as any) || 'kg')
                        if (enteredInStockUnit > (it.currentStock || 0)) {
                            toastError(`Stock insuficiente para ${f.fertilizerType}. Disponible: ${it.currentStock} ${it.unit}`)
                            break
                        }
                    }
                }
            } catch (e) {
                // silencioso
            }
        }
        validateStock()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.fertilizers])

	useEffect(() => {
		if (isOpen) {
			console.log('🔄 Modal abierto, cargando datos...')
			draftReadyRef.current = false
			loadData()
            loadSavedTemplates()
			if (existingDay) {
				setFormData(existingDay)
			} else {
				// Fecha por defecto: hoy
				setFormData({
					date: new Date().toISOString().split('T')[0],
					fertilizers: [],
					waterConsumption: 0,
					waterUnit: (() => { try { return localStorage.getItem('fertigation:waterUnit') || 'm3' } catch { return 'm3' } })(),
					notes: '',
					totalCost: 0
				})
			}
			// Restaurar borrador si existe (solo al crear nuevo)
			try {
				const raw = localStorage.getItem(storageKey)
				if (!existingDay && raw) {
					const parsed = JSON.parse(raw)
					if (parsed?.formData) setFormData(parsed.formData)
                    if (Array.isArray(parsed?.otherExpenses)) setOtherExpenses(parsed.otherExpenses)
				}
			} catch {}
			finally {
				draftReadyRef.current = true
			}
		}
	}, [isOpen, existingDay, storageKey])

	// Foco inicial en el título al abrir
	useEffect(() => {
		if (!isOpen) return
		try { headingRef.current?.focus() } catch {}
	}, [isOpen])

	// Focus trap básico con Tab dentro del modal
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

    const calculateTotalCost = useCallback(() => {
        const { total } = calculateFertigationTotals(formData, availableFertilizers, otherExpenses)
        return total
    }, [formData, availableFertilizers, otherExpenses])

    // Recalcular coste total cuando cambien los datos o precios disponibles
    useEffect(() => {
        if (!isOpen) return
        const newTotalCost = calculateTotalCost()
        setFormData(prev => ({
            ...prev,
            totalCost: newTotalCost
        }))
    }, [calculateTotalCost, isOpen])

    // Autosave con hook reutilizable
    const { savedAt, hasDraft, clearDraft } = useAutosaveDraft({
        isOpen,
        isReadyRef: draftReadyRef,
        storageKey,
        payload: { formData, otherExpenses },
        delay: 500,
    })

	// Persistir preferencia de unidad de agua
	useEffect(() => {
		try { if (formData?.waterUnit) localStorage.setItem('fertigation:waterUnit', formData.waterUnit) } catch {}
	}, [formData?.waterUnit])

    const loadData = async () => {
        try {
            setIsLoadingTemplates(true)
            const products = await productCache.get(`products:${activityName}`, async () => {
                const [fertilizersResponse, waterResponse] = await Promise.all([
                    productAPI.getByType('fertilizer'),
                    productAPI.getByType('water')
                ])
                const fertilizers = fertilizersResponse?.products || fertilizersResponse || []
                const waterProducts = waterResponse?.products || waterResponse || []
                return [...fertilizers, ...waterProducts]
            })
            setAvailableFertilizers(Array.isArray(products) ? products : [])
        } catch (error) {
            console.error('❌ Error loading products:', error)
            setAvailableFertilizers([])
        } finally {
            setIsLoadingTemplates(false)
        }
    }

	const loadSavedTemplates = async () => {
        try {
			setIsLoadingTemplates(true)
            const res = await templateAPI.list('fertigation')
            setSavedTemplates(Array.isArray(res?.templates) ? res.templates : [])
        } catch (e) {
            console.log('No se pudieron cargar plantillas guardadas')
            setSavedTemplates([])
		} finally {
			setIsLoadingTemplates(false)
		}
    }

    // Plantillas rápidas para rellenar el día en 1 click
    const applyTemplate = (templateKey: 'water' | 'light') => {
        const today = new Date().toISOString().split('T')[0]
        if (templateKey === 'water') {
            const tpl = createFertigationTemplate(today, {
                fertilizers: [],
                waterConsumption: 10,
                waterUnit: 'm3',
                notes: 'Riego estándar',
            })
            setFormData({ ...tpl })
            setShowTemplates(false)
            return
        }

        // light: usa el fertilizante con menor precio si existe
        const ferts = (availableFertilizers || []).filter(p => p.type === 'fertilizer')
        const cheapest = [...ferts].sort((a, b) => (a.pricePerUnit || 0) - (b.pricePerUnit || 0))[0]
        const tpl = createFertigationTemplate(today, {
            fertilizers: cheapest ? [{
                productId: cheapest._id,
                fertilizerType: cheapest.name,
                fertilizerAmount: 5,
                fertilizerUnit: cheapest.unit || 'kg',
            }] : [],
            waterConsumption: 10,
            waterUnit: 'm3',
            notes: 'Fertirriego ligero',
        })
        setFormData({ ...tpl })
        setShowTemplates(false)
    }

    const applySavedTemplate = (tpl: any) => {
        const payload = tpl?.payload || {}
        const source: any = payload.formData || payload
        if (!source) return
        const next: DailyFertigationRecord = {
            date: source.date || new Date().toISOString().split('T')[0],
            fertilizers: source.fertilizers || [],
            waterConsumption: source.waterConsumption || 0,
            waterUnit: source.waterUnit || 'm3',
            totalCost: 0,
            notes: source.notes || '',
        }
        setFormData(next)
        setOtherExpenses(source.otherExpenses || [])
        setShowTemplates(false)
    }

    const saveCurrentAsTemplate = async () => {
        if (!newTemplateName.trim()) return
        const payload = { formData, otherExpenses }
        try {
            await templateAPI.create({ name: newTemplateName.trim(), type: 'fertigation', payload })
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
            const payload = { formData, otherExpenses }
            await templateAPI.update(tpl._id, { name: tpl.name, payload })
            await loadSavedTemplates()
        } catch (e) {
            console.error('Error actualizando plantilla', e)
            toastError('No se pudo actualizar la plantilla')
        }
        toastSuccess('Plantilla actualizada')
    }

    const startRenameTemplate = (_tpl: any) => {
        // Renombrado gestionado por TemplatesMenu; noop
    }

    // submitRenameTemplate gestionado ahora por TemplatesMenu

	const handleInputChange = (field: keyof DailyFertigationRecord, value: any) => {
		setFormData(prev => ({ ...prev, [field]: value }))
		if (errors[field]) {
			setErrors(prev => ({ ...prev, [field]: '' }))
		}
	}

	// Cargar último día desde localStorage
    const applyLastDay = async () => {
        const payload = await loadLastDay(activityName, 'fertigation')
        if (!payload?.formData) { toastError('No hay un día previo guardado'); return }
        const source = payload.formData as DailyFertigationRecord
        const next: DailyFertigationRecord = {
            date: new Date().toISOString().split('T')[0],
            fertilizers: source.fertilizers || [],
            waterConsumption: source.waterConsumption || 0,
            waterUnit: source.waterUnit || 'm3',
            totalCost: 0,
            notes: source.notes || ''
        }
        setFormData(next)
        setOtherExpenses(payload.otherExpenses || [])
        setShowTemplates(false)
        toastSuccess('Se ha aplicado el último día')
    }

	const addFertilizer = () => {
		const newFertilizer: FertilizerRecord = {
			productId: '',
			fertilizerType: '',
			fertilizerAmount: 0,
			fertilizerUnit: (() => { try { return localStorage.getItem('defaults:fertilizerUnit') || 'kg' } catch { return 'kg' } })(),
			price: 0,
			unit: 'kg',
			brand: '',
			supplier: '',
			purchaseDate: '',
			cost: 0
		}
		setFormData(prev => ({
			...prev,
			fertilizers: [...prev.fertilizers, newFertilizer]
		}))
	}

	const updateFertilizer = (index: number, field: keyof FertilizerRecord, value: any) => {
		console.log(`🔄 Actualizando fertilizante ${index}, campo ${field}:`, value)
		setFormData(prev => {
			const newFertilizers = prev.fertilizers.map((fertilizer, i) => 
				i === index ? { ...fertilizer, [field]: value } : fertilizer
			)
			console.log(`📦 Nuevo estado de fertilizantes:`, newFertilizers)
			return {
				...prev,
				fertilizers: newFertilizers
			}
		})
	}

    const removeFertilizer = (index: number) => {
        setFormData(prev => {
            const record = prev.fertilizers[index]
            lastRemovedRef.current = { index, record }
            toastShow('info', 'Producto eliminado', {
                actionLabel: 'Deshacer',
                onAction: () => {
                    setFormData(p => {
                        if (!lastRemovedRef.current) return p
                        const { index: idx, record: rec } = lastRemovedRef.current
                        const arr = [...p.fertilizers]
                        arr.splice(idx, 0, rec)
                        return { ...p, fertilizers: arr }
                    })
                    lastRemovedRef.current = null
                }
            })
            return {
                ...prev,
                fertilizers: prev.fertilizers.filter((_, i) => i !== index)
            }
        })
    }

	const duplicateFertilizer = (index: number) => {
		setFormData(prev => {
			const arr = [...prev.fertilizers]
			const src = arr[index]
			if (!src) return prev
			const copy: FertilizerRecord = { ...src }
			arr.splice(index + 1, 0, copy)
			return { ...prev, fertilizers: arr }
		})
		toastSuccess('Línea duplicada')
	}

    const { exportRows } = useExportCsv()
		const exportCsv = () => {
        try {
            const headers = ['Section','Name','Amount','Unit','Price','Cost','Notes','Date']
            const rows: Array<Array<string | number>> = []
            for (const f of formData.fertilizers) {
                const product = f.productId ? productById.get(f.productId) : undefined
                const unitPrice = Number(product?.pricePerUnit ?? f.price ?? 0)
                const unit = (product?.unit || f.unit || 'kg') as any
                const qty = convertAmount(Number(f.fertilizerAmount || 0), (f.unit as any) || unit, unit)
                const cost = qty * unitPrice
                rows.push(['Fertilizer', f.fertilizerType || (product?.name || ''), qty, unit, unitPrice, cost, '', formData.date])
            }
            const water = availableFertilizers.find(p => p.type === 'water')
            if (water) {
                const unit = (water.unit || 'L') as any
                const price = Number(water.pricePerUnit || 0)
                const qty = convertAmount(Number(formData.waterConsumption || 0), formData.waterUnit as any, unit)
                const cost = qty * price
                rows.push(['Water', 'Water', qty, unit, price, cost, '', formData.date])
            }
            for (const e of otherExpenses) {
                const cost = Number(e.expenseAmount) * Number(e.price || 0)
                rows.push(['Other', e.expenseType, e.expenseAmount, e.unit || 'unidad', e.price || 0, cost, '', formData.date])
            }
            const total = Number(calculateTotalCost())
            rows.push(['Total','Day total','','','', total, '', formData.date])
            exportRows(`fertigation_${activityName}_${formData.date}.csv`, headers, rows)
            toastSuccess('CSV exportado')
        } catch {
            toastError('No se pudo exportar el CSV')
        }
    }

		const exportPdf = () => {
			try {
				const lines: string[] = []
				for (const f of formData.fertilizers) {
					const product = f.productId ? productById.get(f.productId) : undefined
					const unitPrice = Number(product?.pricePerUnit ?? f.price ?? 0)
					const unit = (product?.unit || f.unit || 'kg') as any
					const qty = convertAmount(Number(f.fertilizerAmount || 0), (f.unit as any) || unit, unit)
					const cost = qty * unitPrice
					lines.push(`Fertilizante: ${f.fertilizerType || (product?.name || '')} - ${qty} ${unit} x €${unitPrice.toFixed(4)} = €${cost.toFixed(2)}`)
				}
				const water = availableFertilizers.find(p => p.type === 'water')
				if (water) {
					const unit = (water.unit || 'L') as any
					const price = Number(water.pricePerUnit || 0)
					const qty = convertAmount(Number(formData.waterConsumption || 0), formData.waterUnit as any, unit)
					const cost = qty * price
					lines.push(`Agua: ${qty} ${unit} x €${price.toFixed(4)} = €${cost.toFixed(2)}`)
				}
				for (const e of otherExpenses) {
					const cost = Number(e.expenseAmount) * Number(e.price || 0)
					lines.push(`Otro: ${e.expenseType} - ${e.expenseAmount} ${e.unit || 'unidad'} x €${Number(e.price || 0).toFixed(4)} = €${cost.toFixed(2)}`)
				}
				// Get water price for export
				const waterProduct = availableFertilizers.find(p => p.type === 'water')
				const waterPrice = Number(waterProduct?.pricePerUnit || 0)
				
				exportDailyPdfLike(formData.date, activityName, { 
					fertilizers: formData.fertilizers.map(f => ({
						fertilizerType: f.fertilizerType,
						fertilizerAmount: f.fertilizerAmount || 0,
						fertilizerUnit: f.unit || '',
						cost: (f.fertilizerAmount || 0) * (f.price || 0)
					})),
					water: {
						consumption: formData.waterConsumption,
						unit: formData.waterUnit,
						cost: formData.waterConsumption * waterPrice
					},
					otherExpenses: otherExpenses.map(e => ({
						description: e.expenseType,
						amount: e.expenseAmount,
						cost: e.expenseAmount * (e.price || 0)
					})),
					totalCost: formData.totalCost,
					notes: formData.notes,
					area: kpiAreaHa,
					plants: kpiPlants
				})
			} catch {}
		}

	const handleFertilizerTypeChange = async (index: number, productId: string) => {
		console.log('Seleccionando producto:', productId, 'para índice:', index)
		
		if (!productId) {
			// Limpiar el fertilizante si no se selecciona nada
			setFormData(prev => {
				const newFertilizers = prev.fertilizers.map((f, i) => i === index ? {
					...f,
					productId: '',
					fertilizerType: '',
					price: 0,
					brand: '',
					supplier: '',
					purchaseDate: '',
					unit: 'kg'
				} : f)
				return { ...prev, fertilizers: newFertilizers }
			})
			return
		}

		try {
			const product = productById.get(productId)
			console.log('Producto encontrado:', product)

			if (!product) {
				console.error('Producto no encontrado en availableFertilizers')
				return
			}

            // Cargar última compra para enriquecer marca/proveedor si existe
            let lastPurchaseBrand = product.brand || ''
            let lastPurchaseSupplier = (product as any).supplierName || product.supplier || ''
            let lastPurchaseDate = product.purchaseDate || ''
            try {
                const purchasesResp = await purchaseAPI.getByProduct(productId)
                const purchases: any[] = Array.isArray(purchasesResp)
                    ? purchasesResp
                    : (Array.isArray(purchasesResp?.purchases)
                        ? purchasesResp.purchases
                        : (Array.isArray(purchasesResp?.items) ? purchasesResp.items : []))
                if (purchases.length > 0) {
                    purchases.sort((a: any, b: any) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime())
                    const last = purchases[0]
                    lastPurchaseBrand = last.brand || lastPurchaseBrand
                    lastPurchaseSupplier = last.supplier || lastPurchaseSupplier
                    lastPurchaseDate = last.purchaseDate || lastPurchaseDate
                }
            } catch (e) {
				console.log('No hay compras para este producto o error recuperándolas (continuamos):', (e as Error).message)
			}

			const price = Number(product.pricePerUnit) || 0
			const unit = product.unit || 'kg'

            // Actualizar y recalcular total inmediatamente
            setFormData(prev => {
                const newFertilizers = prev.fertilizers.map((f, i) => i === index ? {
                    ...f,
                    productId,
                    fertilizerType: product.name,
                    price,
                    unit,
                    brand: lastPurchaseBrand,
                    supplier: lastPurchaseSupplier,
                    purchaseDate: lastPurchaseDate
                } : f)
                const next = { ...prev, fertilizers: newFertilizers }
                // Actualizar recientes con hook
                try { pushRecent(productId) } catch {}
				const totals = calculateFertigationTotals(next, availableFertilizers, otherExpenses)
                return { ...next, totalCost: totals.total }
            })

			// Info inventario opcional
            // Prefetch de inventario en batch
            scheduleInventoryFetch(productId)
		} catch (error) {
			console.error('Error loading product details:', error)
		}
	}

    // calculateTotalCost está memorizada arriba

	const handleOtherExpensesSubmit = (expenses: OtherExpenseRecord[]) => {
		setOtherExpenses(expenses)
		console.log('Otros gastos guardados:', expenses)
	}

    const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setIsSubmitting(true)

		try {
			// Validar formulario
			const newErrors: { [key: string]: string } = {}
			
			if (!formData.date) {
				newErrors.date = 'La fecha es requerida'
			}
			
			// Permitir solo agua o solo fertilizantes o ambos
			if (formData.fertilizers.length === 0 && formData.waterConsumption === 0) {
				newErrors.general = 'Debe añadir al menos un fertilizante o consumo de agua'
			}

			// Validar stock disponible
			for (let i = 0; i < formData.fertilizers.length; i++) {
				const fertilizer = formData.fertilizers[i]
				if (fertilizer.productId && fertilizer.fertilizerAmount > 0) {
					try {
						const inventoryItem = await inventoryAPI.getByProduct(fertilizer.productId)
						if (inventoryItem && fertilizer.fertilizerAmount > inventoryItem.currentStock) {
							newErrors[`fertilizer_${i}`] = `Stock insuficiente. Disponible: ${inventoryItem.currentStock} ${inventoryItem.unit}`
						}
					} catch (error) {
						console.error('Error validating stock:', error)
					}
				}
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

			// Calcular costos
			const updatedFormData = {
				...formData,
				totalCost: calculateTotalCost(),
				fertilizers: formData.fertilizers.map(f => ({
					...f,
					cost: f.fertilizerAmount * (f.price || 0)
				})),
				otherExpenses: otherExpenses
			}

            // Confirmación si hay stock insuficiente en alguna línea
            let hasInsufficient = false
            for (let i = 0; i < formData.fertilizers.length; i++) {
                const f = formData.fertilizers[i]
                if (!f.productId || !f.fertilizerAmount) continue
                const info = stockByProduct[f.productId]
                if (!info) continue
                const enteredInStockUnit = convertAmount(Number(f.fertilizerAmount || 0), (f.unit as any) || 'kg', (info.unit as any) || 'kg')
                if (enteredInStockUnit > (info.stock || 0)) { hasInsufficient = true; break }
            }
            if (hasInsufficient) {
                const ok = window.confirm('Hay líneas con stock insuficiente. ¿Confirmas guardar igualmente?')
                if (!ok) { setIsSubmitting(false); return }
            }

            // Llamar a la función onSubmit que ahora conectará con el backend
			await onSubmit(updatedFormData)
			
            // Preparar datos para el desglose de costes
            const waterProduct = availableFertilizers.find(p => p.type === 'water')
            const waterPrice = Number(waterProduct?.pricePerUnit || 0)
            const waterUnitTarget = (waterProduct?.unit || formData.waterUnit) as any
            const waterQtyInProductUnit = convertAmount(Number(formData.waterConsumption || 0), formData.waterUnit as any, waterUnitTarget)

            const breakdownData = {
				fertilizers: formData.fertilizers.map(f => ({
					name: f.fertilizerType,
					amount: f.fertilizerAmount,
					unit: f.unit || 'kg',
					price: f.price || 0,
					cost: f.fertilizerAmount * (f.price || 0)
				})),
				phytosanitaries: [], // No hay fitosanitarios en fertirriego
				water: {
                    consumption: waterQtyInProductUnit,
                    unit: waterUnitTarget,
                    price: waterPrice,
                    cost: waterQtyInProductUnit * waterPrice
				},
				others: otherExpenses.map(expense => ({
					name: expense.expenseType,
					amount: expense.expenseAmount,
					unit: expense.unit || 'unidad',
					price: expense.price || 0,
					cost: expense.expenseAmount * (expense.price || 0)
				}))
			}
			
			setCostBreakdownData(breakdownData)
			setShowCostBreakdown(true)
			setAriaStatus('Día de fertirriego guardado correctamente')
			
			// Persistir último día para "Usar último día"
            try { localStorage.setItem(`fertigation:last:${activityName}`, JSON.stringify({ formData: updatedFormData, otherExpenses })) } catch {}
            // Subir a backend como plantilla especial LAST__activityName
            saveLastDay(activityName, 'fertigation', { formData: updatedFormData as any, otherExpenses })
            // Limpiar borrador tras guardar
            try { localStorage.removeItem(storageKey) } catch {}
			onClose()
		} catch (error) {
			console.error('Error submitting fertigation day:', error)
			setAriaStatus('Error al guardar el día de fertirriego')
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleNumberFocus = (e: React.FocusEvent<HTMLInputElement>) => {
		// Limpiar el valor si es 0 y seleccionar todo el texto
		const value = e.target.value
		if (value === '0' || value === '0.00' || value === '0.0') {
			e.target.value = ''
			// Pequeño delay para asegurar que el valor se limpia antes de seleccionar
			setTimeout(() => {
				e.target.select()
			}, 10)
		} else {
			// Seleccionar todo el texto para facilitar la edición
			e.target.select()
		}
	}

    const handleNumberBlur = (e: React.FocusEvent<HTMLInputElement>) => {
		// Si el campo está vacío, poner 0
		if (e.target.value === '' || e.target.value === null || e.target.value === undefined) {
			e.target.value = '0'
		}
	}

	if (!isOpen) return null

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="fertigation-modal-title" ref={modalRef}>
			<div className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl shadow-xl transition-colors ${
				isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
			}`}>
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
					<h2 id="fertigation-modal-title" ref={headingRef} tabIndex={-1} className="text-xl font-bold">
						{existingDay ? 'Editar Día de Fertirriego' : 'Añadir Día de Fertirriego'}
					</h2>
					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={() => {
								// Limpiar formulario y borrador
								setFormData({
									date: new Date().toISOString().split('T')[0],
									fertilizers: [],
									waterConsumption: 0,
									waterUnit: (() => { try { return localStorage.getItem('fertigation:waterUnit') || 'm3' } catch { return 'm3' } })(),
									notes: '',
									totalCost: 0
								})
								setOtherExpenses([])
                                try { localStorage.removeItem(storageKey) } catch {}
							}}
							className={`${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'} px-3 py-1 rounded-lg text-xs`}
						>
							Limpiar
						</button>
                        {hasDraft && (
							<button
								type="button"
                                onClick={() => { clearDraft() }}
								className={`${isDarkMode ? 'bg-yellow-700 hover:bg-yellow-600 text-white' : 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800'} px-3 py-1 rounded-lg text-xs`}
							>
								Borrar borrador
							</button>
						)}
                        {savedAt && (
							<span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                Borrador guardado: {new Date(savedAt).toLocaleTimeString()}
							</span>
						)}
                        <button
                            onClick={() => {
                                try {
                                    const saved = localStorage.getItem(storageKey)
                                    const current = JSON.stringify({ formData, otherExpenses })
                                    if (saved && saved !== current) {
                                        const confirmLeave = window.confirm('Tienes cambios no guardados. ¿Cerrar sin guardar?')
                                        if (!confirmLeave) return
                                    }
                                } catch {}
                                onClose()
                            }}
							className={`p-2 rounded-lg transition-colors ${
								isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
							}`}
						>
							<X className="h-5 w-5" />
						</button>
					</div>
				</div>

				{/* Screen reader announcements for aggregated errors and status */}
				<div className="sr-only" aria-live="polite">{[...Object.values(errors || {}).filter(Boolean), ariaStatus].filter(Boolean).join('. ')}</div>

				{/* Content */}
				<div className="p-6" ref={modalRef}>
					<div className="mb-4">
						<p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
							Actividad: <span className="font-medium">{activityName}</span>
						</p>
					</div>

                    <form id="fertigation-form" onSubmit={handleSubmit} className="space-y-6" aria-describedby="fertigation-modal-title" aria-busy={isSubmitting}>
						{/* Fecha */}
                        <div data-error-anchor="date">
							<label className={`block text-sm font-medium mb-2 ${
								isDarkMode ? 'text-gray-300' : 'text-gray-700'
							}`}>
								Fecha del Día
							</label>
                            <input
								type="date"
								value={formData.date}
                                ref={dateInputRef}
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

						{/* Fertilizantes */}
						<div>
						<div className="flex items-center justify-between mb-4">
							<label className={`text-sm font-medium ${
									isDarkMode ? 'text-gray-300' : 'text-gray-700'
								}`}>
									Productos (Fertilizantes)
								</label>
							<div className="flex items-center gap-2 relative">
								<div className="relative">
                                    <button
										type="button"
										aria-haspopup="menu"
										aria-expanded={showTemplates ? true : false}
										aria-controls="fertigation-templates-menu"
										onClick={() => setShowTemplates(v => !v)}
										className={`${isDarkMode ? 'bg-green-700 text-white hover:bg-green-600' : 'bg-green-100 text-green-800 hover:bg-green-200'} px-3 py-1 rounded-lg text-sm`}
									>
										Usar Plantilla
									</button>
                                    {showTemplates && (
										<div id="fertigation-templates-menu">
										<TemplatesMenu
 											isDarkMode={isDarkMode}
 											isLoading={isLoadingTemplates}
 											savedTemplates={savedTemplates as any}
 											onApplyLastDay={applyLastDay}
 											onApplyQuick={() => applyTemplate('water')}
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
									onClick={addFertilizer}
									className="flex items-center space-x-2 px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
								>
									<Plus className="h-4 w-4" />
									<span>Añadir Fertilizante</span>
								</button>
							</div>
							</div>

                            {formData.fertilizers.length === 0 ? (
                                <EmptyState isDarkMode={isDarkMode} title="No hay productos añadidos" subtitle={availableFertilizers.length === 0 ? 'No hay fertilizantes registrados. Ve a Gestión > Productos y Precios para añadir fertilizantes.' : 'Haz clic en "Añadir Fertilizante" para comenzar'} />
                            ) : (
								<div className="space-y-4">
									{formData.fertilizers.map((fertilizer, index) => {
										console.log(`🎯 Renderizando fertilizante ${index}:`, fertilizer)
										return (
										<div
											key={index}
											className={`p-4 border rounded-lg transition-colors ${
												isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
											}`}
										>
											<div className="flex items-center justify-between mb-3">
												<h4 className="font-medium">Producto {index + 1}</h4>
										<div className="flex items-center gap-2">
										<button
                                                    type="button"
                                    onClick={() => { const ok = window.confirm('¿Eliminar este producto?'); if (!ok) return; removeFertilizer(index) }}
                                                    className="text-red-500 hover:text-red-700 transition-colors"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
										<button type="button" onClick={() => duplicateFertilizer(index)} className={`${isDarkMode ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'} px-2 py-1 rounded text-xs`}>Duplicar</button>
										</div>
											</div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div data-error-anchor={`fertilizer_${index}`}>
                                                    <label className={`block text-sm font-medium mb-2 ${
                                                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                                    }`}>
                                                        Tipo de Fertilizante
                                                    </label>
                                                    <ProductSelect
                                                        isDarkMode={isDarkMode}
                                                        indexKey={index}
                                                        value={fertilizer.productId || ''}
                                                        options={availableFertilizers.filter(p => p.type === 'fertilizer') as any}
                                                        recentIds={recentProductIds}
                                                        filterText={selectFilterTextByIndex[index] || ''}
                                                        onFilterChange={(t) => setSelectFilterTextByIndex(prev => ({ ...prev, [index]: t }))}
                                                        onChange={(pid) => handleFertilizerTypeChange(index, pid)}
                                                    />
                                    <div className="grid grid-cols-2 gap-2 mb-2">
										<div>
											<label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Área (ha)</label>
											<input type="number" step="0.01" min="0" value={kpiAreaHa || ''} onChange={e => {
												const v = Number(e.target.value || 0)
												setKpiAreaHa(v)
												try { localStorage.setItem(`fertigation:kpi:area:${activityName}`, String(v)) } catch {}
											}} className={`w-full px-2 py-1 rounded border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`} placeholder="0" />
										</div>
										<div>
											<label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Plantas</label>
											<input type="number" step="1" min="0" value={kpiPlants || ''} onChange={e => {
												const v = Number(e.target.value || 0)
												setKpiPlants(v)
												try { localStorage.setItem(`fertigation:kpi:plants:${activityName}`, String(v)) } catch {}
											}} className={`w-full px-2 py-1 rounded border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`} placeholder="0" />
										</div>
									</div>
                                                    {/* Productos recientes (si hay) */}
                                                    {/* ProductSelect ya contiene el input de búsqueda, recientes y select */}
                                        {fertilizer.productId && productById.get(fertilizer.productId) && (fertilizer.unit || 'kg') !== (productById.get(fertilizer.productId)!.unit || 'kg') && (
                                            <p className={`mt-1 text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                ≈ {convertAmount(Number(fertilizer.fertilizerAmount || 0), (fertilizer.unit as any) || 'kg', (productById.get(fertilizer.productId)!.unit as any) || 'kg').toFixed(3)} {productById.get(fertilizer.productId)!.unit} (precio en {productById.get(fertilizer.productId)!.unit})
                                            </p>
                                        )}
                                        <StockBadge info={stockByProduct[fertilizer.productId || '']} isDarkMode={isDarkMode} />
                                        {fertilizer.productId && (
                                            <div className="mt-2">
                                                <button
                                                    type="button"
                                                    onClick={() => { setShowPurchaseModal(true) }}
                                                    className={`${isDarkMode ? 'bg-blue-700 hover:bg-blue-600 text-white' : 'bg-blue-100 text-blue-800 hover:bg-blue-200'} px-2 py-1 rounded text-xs`}
                                                >
                                                    Registrar compra
                                                </button>
                                            </div>
                                        )}
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
															value={fertilizer.fertilizerAmount}
														onChange={(e) => {
															const v = validatePositiveNumberField(e.target.value, Number(fertilizer.fertilizerAmount || 0))
															if (v.error) {
																setErrors(prev => ({ ...prev, [`fertilizerAmount_${index}`]: v.error as string }))
															} else {
																setErrors(prev => { const n: any = { ...prev }; delete n[`fertilizerAmount_${index}`]; return n })
																const value = sanitizeNumber(String(v.value))
																const unitPrice = unitPriceFor(fertilizer.productId, fertilizer.price, availableFertilizers)
																updateFertilizer(index, 'fertilizerAmount', value)
																updateFertilizer(index, 'price', unitPrice)
																// validación inmediata de stock usando cache local
																const cached = stockByProduct[fertilizer.productId || '']
																if (fertilizer.productId && cached && value > (cached.stock || 0)) {
																	const path = `/inventario?productId=${fertilizer.productId}`
																	toastShow('error', `Stock insuficiente para ${fertilizer.fertilizerType || 'producto'}. Disponible: ${cached.stock} ${cached.unit || 'u'}`, {
																		actionLabel: 'Abrir inventario',
																		onAction: () => navigate(path),
																	})
																}
															}
														}}
                                                            onFocus={handleNumberFocus}
                                                            onKeyDown={preventInvalidNumberKeys}
															onBlur={handleNumberBlur}
															className={`flex-1 px-3 py-2 border rounded-lg transition-colors ${
																isDarkMode 
																	? 'bg-gray-700 border-gray-600 text-white' 
																	: 'bg-white border-gray-300 text-gray-900'
															}`}
															aria-invalid={Boolean(errors[`fertilizerAmount_${index}`])}
															aria-describedby={errors[`fertilizerAmount_${index}`] ? `fertilizerAmount_${index}_error` : undefined}
														/>
														<select
															value={fertilizer.unit || 'kg'}
														onChange={(e) => {
															const u = e.target.value
                                                            const ok = validateUnitForType(u, ['kg','g','L','ml'])
															if (!ok.ok) { setErrors(prev => ({ ...prev, [`fertilizerUnit_${index}`]: ok.message || 'Unidad inválida' })); return }
															setErrors(prev => { const n: any = { ...prev }; delete n[`fertilizerUnit_${index}`]; return n })
															updateFertilizer(index, 'unit', u)
														}}
															className={`px-3 py-2 border rounded-lg transition-colors ${
																isDarkMode 
																	? 'bg-gray-700 border-gray-600 text-white' 
																	: 'bg-white border-gray-300 text-gray-900'
															}`}
														>
															<option value="kg">kg</option>
															<option value="g">g</option>
															<option value="L">L</option>
															<option value="ml">ml</option>
														</select>
													{errors[`fertilizerAmount_${index}`] && (<p id={`fertilizerAmount_${index}_error`} className="text-red-500 text-sm mt-1">{errors[`fertilizerAmount_${index}`]}</p>)}
													{errors[`fertilizerUnit_${index}`] && (<p className="text-red-500 text-sm mt-1">{errors[`fertilizerUnit_${index}`]}</p>)}
                                </div>
                                <div className="hidden md:flex items-center gap-2 ml-2 text-xs">
                                    {inventoryLastSyncAt && (
                                        <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                            Inventario sincronizado {new Date(inventoryLastSyncAt).toLocaleTimeString()}
                                        </span>
                                    )}
                                    <button type="button" onClick={async () => {
                                        try {
                                            const ids = Array.from(new Set(formData.fertilizers.map(f => f.productId).filter(Boolean))) as string[]
                                            if (ids.length === 0) return
                                            const mapRes = await inventoryAPI.getByProducts(ids)
                                            const itemsMap: Record<string, { _id: string; currentStock: number; unit: string }> = mapRes?.items || {}
                                            setStockByProduct(prev => {
                                                const next = { ...prev }
                                                for (const id of ids) {
                                                    const it = itemsMap[id]
                                                    next[id] = { stock: Number(it?.currentStock) || 0, unit: it?.unit || prev[id]?.unit || 'kg' }
                                                }
                                                return next
                                            })
                                            setInventoryLastSyncAt(Date.now())
                                        } catch {}
                                    }} className={`${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'} px-2 py-1 rounded`}>Revalidar inventario</button>
                                </div>
												</div>
											</div>

                                            {/* Información del producto */}
                                            {fertilizer.productId && (
												<div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
									<div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
														<div>
															<span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
																Marca:
                                                            </span> {fertilizer.brand || '—'}
														</div>
														<div>
															<span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
																Proveedor:
                                                            </span> {fertilizer.supplier || '—'}
														</div>
														<div>
															<span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
																Precio:
												</span> {formatCurrencyEUR(Number(availableFertilizers.find(p => p._id === fertilizer.productId)?.pricePerUnit ?? fertilizer.price ?? 0))}/{availableFertilizers.find(p => p._id === fertilizer.productId)?.unit ?? fertilizer.unit ?? 'kg'}
														</div>
													</div>
									<div className="mt-2">
														<span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
															Coste:
										</span> {formatCurrencyEUR(Number(fertilizer.fertilizerAmount * ((productById.get(fertilizer.productId!)?.pricePerUnit ?? fertilizer.price ?? 0))))}
													</div>
                                                </div>
                                            )}

                                            {errors[`fertilizer_${index}`] && (
												<p className="text-red-500 text-sm mt-2">{errors[`fertilizer_${index}`]}</p>
											)}
										</div>
                                        
									)})}
								</div>
							)}

							{errors.fertilizers && (
								<p className="text-red-500 text-sm mt-2">{errors.fertilizers}</p>
							)}
							
								{errors.general && (
									<p className="text-red-500 text-sm mt-2">{errors.general}</p>
								)}
						</div>

						{/* Consumo de Agua */}
						<div>
							<label className={`block text-sm font-medium mb-2 ${
								isDarkMode ? 'text-gray-300' : 'text-gray-700'
							}`}>
								Consumo de Agua
							</label>
							<div className="flex space-x-2">
                                <input
									type="number"
									step="0.01"
									min="0"
										value={formData.waterConsumption}
										onChange={(e) => handleInputChange('waterConsumption', sanitizeNumber(e.target.value))}
									onFocus={handleNumberFocus}
                                    onKeyDown={preventInvalidNumberKeys}
									onBlur={handleNumberBlur}
									className={`flex-1 px-3 py-2 border rounded-lg transition-colors ${
										isDarkMode 
											? 'bg-gray-700 border-gray-600 text-white' 
											: 'bg-white border-gray-300 text-gray-900'
									}`}
									placeholder="0"
								/>
								<select
									value={formData.waterUnit}
									onChange={(e) => handleInputChange('waterUnit', e.target.value)}
									className={`px-3 py-2 border rounded-lg transition-colors ${
										isDarkMode 
											? 'bg-gray-700 border-gray-600 text-white' 
											: 'bg-white border-gray-300 text-gray-900'
									}`}
								>
										<option value="m3">m³</option>
										<option value="L">L</option>
								</select>
							</div>
						</div>

						{/* Otros Gastos */}
						<div>
							<div className="flex items-center justify-between mb-4">
								<label className={`text-sm font-medium ${
									isDarkMode ? 'text-gray-300' : 'text-gray-700'
								}`}>
									Otros Gastos (Mano de obra, maquinaria, materiales, etc.)
								</label>
								<button
									type="button"
									onClick={() => setShowOtherExpensesModal(true)}
									className="flex items-center space-x-2 px-3 py-1 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
								>
									<Plus className="h-4 w-4" />
									<span>Gestionar Otros Gastos</span>
								</button>
							</div>

							{otherExpenses.length === 0 ? (
								<div className={`p-4 border-2 border-dashed rounded-lg text-center ${
									isDarkMode ? 'border-gray-600 text-gray-400' : 'border-gray-300 text-gray-500'
								}`}>
									<p className="text-sm mb-2">No hay otros gastos añadidos</p>
									<p className="text-xs">Haz clic en "Gestionar Otros Gastos" para añadir mano de obra, maquinaria, etc.</p>
								</div>
							) : (
								<div className="space-y-2">
									{otherExpenses.map((expense, index) => (
										<div
											key={index}
											className={`p-3 border rounded-lg ${
												isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
											}`}
										>
											<div className="flex justify-between items-center">
												<div>
													<span className="font-medium">{expense.expenseType}</span>
													<span className={`text-sm ml-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
														{expense.expenseAmount} {expense.unit}
													</span>
												</div>
												<span className="font-semibold text-purple-600">
													{formatCurrencyEUR(Number(expense.expenseAmount * (expense.price || 0)))}
												</span>
											</div>
										</div>
									))}
								</div>
							)}
						</div>

						{/* Notas */}
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
								placeholder="Observaciones sobre el fertirriego del día..."
							/>
						</div>

						{/* Coste Total */}
                        <div className={`p-4 rounded-lg ${
							isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
						}`}>
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between">
                                    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Subtotal fertilizantes</span>
                                    <span className="font-semibold">
                                        {formatCurrencyEUR(Number(
                                            formData.fertilizers.reduce((s, f) => {
                                                const product = f.productId ? productById.get(f.productId) : undefined
                                                const unitPrice = Number(product?.pricePerUnit ?? f.price ?? 0)
                                                const unit = (product?.unit || f.unit || 'kg') as any
                                                const qty = convertAmount(Number(f.fertilizerAmount || 0), (f.unit as any) || unit, unit)
                                                return s + (qty * unitPrice)
                                            }, 0)
                                        ))}
                                    </span>
                                </div>
                                <KpiPanel
                                    areaHa={kpiAreaHa}
                                    plants={kpiPlants}
                                    totalCost={Number(calculateTotalCost())}
                                    formatCurrency={n => formatCurrencyEUR(Number(n))}
                                    isDarkMode={isDarkMode}
                                />
                                <div className="flex justify-between">
                                    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Subtotal agua</span>
                                    <span className="font-semibold">
                                    {(() => {
                                        const water = availableFertilizers.find(p => p.type === 'water')
                                        const unit = (water?.unit || 'L') as any
                                        const price = Number(water?.pricePerUnit || 0)
                                        const qty = convertAmount(Number(formData.waterConsumption || 0), formData.waterUnit as any, unit)
                                        return (
                                            <span>
                                                {formatCurrencyEUR(qty * price)}
                                                <span className={`ml-2 text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                    {formData.waterUnit !== unit && `≈ ${qty.toFixed(3)} ${unit}`}
                                                </span>
                                            </span>
                                        )
                                    })()}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Subtotal otros</span>
                                    <span className="font-semibold">
                                        {formatCurrencyEUR(Number(otherExpenses.reduce((s, e) => s + e.expenseAmount * (e.price || 0), 0)))}
                                    </span>
                                </div>
                                <div className="h-px bg-gray-300 dark:bg-gray-600" />
                                {(() => {
                                    const fertSubtotal = formData.fertilizers.reduce((s, f) => {
                                        const product = f.productId ? productById.get(f.productId) : undefined
                                        const unitPrice = Number(product?.pricePerUnit ?? f.price ?? 0)
                                        const unit = (product?.unit || f.unit || 'kg') as any
                                        const qty = convertAmount(Number(f.fertilizerAmount || 0), (f.unit as any) || unit, unit)
                                        return s + (qty * unitPrice)
                                    }, 0)
                                    const water = availableFertilizers.find(p => p.type === 'water')
                                    const waterUnit = (water?.unit || 'L') as any
                                    const waterPrice = Number(water?.pricePerUnit || 0)
                                    const waterQty = convertAmount(Number(formData.waterConsumption || 0), formData.waterUnit as any, waterUnit)
                                    const waterSubtotal = waterQty * waterPrice
                                    const othersSubtotal = otherExpenses.reduce((s, e) => s + e.expenseAmount * (e.price || 0), 0)
                                    const total = fertSubtotal + waterSubtotal + othersSubtotal
                                    const pct = (n: number) => total > 0 ? Math.round((n / total) * 100) : 0
                                    return (
                                        <div className="flex flex-col gap-1">
                                            <div className="flex justify-between items-center">
                                                <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Coste Total del Día:</span>
                                                <span className="text-lg font-bold text-green-600">{formatCurrencyEUR(total)}</span>
                                            </div>
                                            <div className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                Fertilizantes: {pct(fertSubtotal)}% · Agua: {pct(waterSubtotal)}% · Otros: {pct(othersSubtotal)}%
                                            </div>
                                        </div>
                                    )
                                })()}
                            </div>
						</div>

						{/* Actions */}
                        <div className="flex flex-wrap gap-3 justify-end pt-6 border-t border-gray-200 dark:border-gray-700 sticky bottom-0 bg-inherit pb-6">
							<button type="button" onClick={exportCsv} className={`${isDarkMode ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'} px-3 py-2 rounded-lg text-sm`}>Exportar CSV</button>
							<button type="button" onClick={exportPdf} className={`${isDarkMode ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'} px-3 py-2 rounded-lg text-sm`}>Exportar PDF</button>
                            <button
                                type="button"
                                onClick={() => {
                                    try {
                                        const saved = localStorage.getItem(storageKey)
                                        const current = JSON.stringify({ formData, otherExpenses })
                                        if (saved && saved !== current) {
                                            const confirmLeave = window.confirm('Tienes cambios no guardados. ¿Cerrar sin guardar?')
                                            if (!confirmLeave) return
                                        }
                                    } catch {}
                                    onClose()
                                }}
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
								className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
							>
								{isSubmitting ? 'Guardando...' : (existingDay ? 'Actualizar Día' : 'Añadir Día')}
							</button>
						</div>
					</form>
				</div>
			</div>
			
			{/* Modal de Desglose de Costes */}
			{showCostBreakdown && costBreakdownData && (
				<CostBreakdownModal
					isOpen={showCostBreakdown}
					onClose={() => setShowCostBreakdown(false)}
					activityName={activityName}
					date={formData.date}
					costs={costBreakdownData}
					isDarkMode={isDarkMode}
				/>
			)}

			{/* Modal de Otros Gastos */}
			<OtherExpensesModal
				isOpen={showOtherExpensesModal}
				onClose={() => setShowOtherExpensesModal(false)}
				onSubmit={handleOtherExpensesSubmit}
				existingExpenses={otherExpenses}
				isDarkMode={isDarkMode}
			/>

			{/* Modal de Registro de Compras (prefill con producto) */}
			{showPurchaseModal && (
				<PurchaseRegistrationModal
					isOpen={showPurchaseModal}
					onClose={() => {
						setShowPurchaseModal(false)
					}}
					isDarkMode={isDarkMode}
				/>
			)}

			{/* Toast */}

		</div>
	)
}

export default FertigationDayModal  