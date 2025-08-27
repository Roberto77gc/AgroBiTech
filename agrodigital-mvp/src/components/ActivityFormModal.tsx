import React, { useState, useEffect } from 'react'
import {
  X,
  Calendar,
  Upload,
  Image as ImageIcon,
  Trash2,
  Leaf,
  Zap,
  Droplets,
  Plus,
  Shield,
} from 'lucide-react'
import type {
  FertigationData,
  PhytosanitaryData,
  EnergyData,
  DailyFertigationRecord,
  DailyPhytosanitaryRecord,
  FertilizerRecord,
  ProductPrice,
  Supplier,
  ProductPurchase,
} from '../types'
import { formatCurrencyEUR } from '../utils/format'
import { convertAmount } from '../utils/units'
import { productAPI, supplierAPI, purchaseAPI, inventoryAPI } from '../services/api'
import StockBadge from './common/StockBadge'

// Definir tipos locales que ya no existen en types.ts
type ActivityStatus = 'planning' | 'in_progress' | 'completed' | 'paused'
type ActivityPriority = 'low' | 'medium' | 'high'

interface ActivityFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (activityData: any) => void
  isDarkMode: boolean
}

const ActivityFormModal: React.FC<ActivityFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isDarkMode,
}) => {
  const [formData, setFormData] = useState({
    // Información básica
    name: '',
    cropType: '',
    plantCount: 0,
    area: 0,
    areaUnit: 'm2' as 'ha' | 'm2',
    transplantDate: '',
    sigpacReference: '',

    // Documentación
    photos: [] as string[],

    // Gestión de recursos
    fertigation: {
      enabled: false,
      dailyRecords: [] as DailyFertigationRecord[],
      notes: '',
    } as FertigationData,

    phytosanitary: {
      enabled: false,
      dailyRecords: [] as DailyPhytosanitaryRecord[],
      notes: '',
    } as PhytosanitaryData,

    water: {
      enabled: false,
      waterSource: '',
      irrigationType: '',
      dailyRecords: [] as Array<{ date: string; amount: number; unit: string; notes?: string }>,
      notes: '',
    },

    energy: {
      enabled: false,
      energyType: '',
      dailyConsumption: 0,
      energyUnit: 'kWh',
      cost: 0,
      notes: '',
    } as EnergyData,

    // Información adicional
    location: '',
    weather: '',
    notes: '',
    status: 'planning' as ActivityStatus,
    priority: 'medium' as ActivityPriority,
    totalCost: 0,

    // Agrupación
    cycleId: '',
    dayNumber: 0,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [availableFertilizers, setAvailableFertilizers] = useState<ProductPrice[]>([])
  const [availableSuppliers, setAvailableSuppliers] = useState<Supplier[]>([])
  const [availablePhytosanitaries, setAvailablePhytosanitaries] = useState<ProductPrice[]>([])
  const [stockByProduct, setStockByProduct] = useState<
    Record<string, { stock: number; unit: string; minStock?: number; criticalStock?: number }>
  >({})
  const [inventoryLastSyncAt, setInventoryLastSyncAt] = useState<number | null>(null)

  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [ariaStatus, setAriaStatus] = useState<string>('')

  const validateForm = async () => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.name.trim()) newErrors.name = 'El nombre de la actividad es requerido'
    if (formData.area <= 0) newErrors.area = 'La extensión debe ser mayor a 0'
    if (formData.totalCost < 0) newErrors.totalCost = 'El coste total no puede ser negativo'

    if (formData.fertigation.enabled) {
      for (let r = 0; r < formData.fertigation.dailyRecords.length; r++) {
        const record = formData.fertigation.dailyRecords[r]
        for (let f = 0; f < record.fertilizers.length; f++) {
          const fertilizer = record.fertilizers[f]
          if (fertilizer.productId) {
            try {
              const inventoryItem = await inventoryAPI.getByProduct(fertilizer.productId)
              if (inventoryItem) {
                const entered = convertAmount(
                  Number(fertilizer.fertilizerAmount || 0),
                  (fertilizer.fertilizerUnit as any) || 'kg',
                  (inventoryItem.unit as any) || 'kg',
                )
                if (entered > Number(inventoryItem.currentStock || 0)) {
                  newErrors[`fertigation_${r}_${f}`] = `Stock insuficiente. Disponible: ${inventoryItem.currentStock} ${inventoryItem.unit}`
                }
              } else {
                newErrors[`fertigation_${r}_${f}`] = 'Producto no disponible en inventario'
              }
            } catch {
              newErrors[`fertigation_${r}_${f}`] = 'Error verificando inventario'
            }
          }
        }
      }
    }

    if (formData.phytosanitary.enabled) {
      for (let r = 0; r < (formData.phytosanitary.dailyRecords || []).length; r++) {
        const day = formData.phytosanitary.dailyRecords[r]
        for (let p = 0; p < (day.phytosanitaries || []).length; p++) {
          const item: any = (day.phytosanitaries || [])[p]
          if (item?.productId) {
            try {
              const phytosanitaryInventoryItem = await inventoryAPI.getByProduct(item.productId)
              if (phytosanitaryInventoryItem) {
                const entered = convertAmount(
                  Number(item.phytosanitaryAmount || 0),
                  (item.phytosanitaryUnit as any) || 'L',
                  (phytosanitaryInventoryItem.unit as any) || 'L',
                )
                if (entered > Number(phytosanitaryInventoryItem.currentStock || 0)) {
                  newErrors[`phytosanitary_${r}_${p}`] = `Stock insuficiente. Disponible: ${phytosanitaryInventoryItem.currentStock} ${phytosanitaryInventoryItem.unit}`
                }
              } else {
                newErrors[`phytosanitary_${r}_${p}`] = 'Producto no disponible en inventario'
              }
            } catch {
              newErrors[`phytosanitary_${r}_${p}`] = 'Error verificando inventario'
            }
          }
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!(await validateForm())) {
      setAriaStatus('Hay errores de validación en el formulario')
      return
    }

    setIsSubmitting(true)
    try {
      let totalCost = 0
      const consumedProducts: Array<{ productId: string; productName: string; amount: number; unit: string }> = []

      if (formData.fertigation.enabled) {
        for (const record of formData.fertigation.dailyRecords) {
          for (const fertilizer of record.fertilizers) {
            if (fertilizer.productId) {
              const product = availableFertilizers.find(p => p._id === fertilizer.productId)
              if (product) {
                const convertedAmount = convertAmount(
                  Number(fertilizer.fertilizerAmount || 0),
                  (fertilizer.fertilizerUnit as any) || (product.unit as any) || 'kg',
                  (product.unit as any) || 'kg',
                )
                totalCost += Number(convertedAmount || 0) * Number(product.pricePerUnit || 0)
                // Consumo real lo hará el backend al persistir.
                consumedProducts.push({
                  productId: product._id,
                  productName: product.name,
                  amount: Number(convertedAmount || 0),
                  unit: (product.unit as any) || 'kg',
                })
              }
            }
          }
        }
      }

      if (formData.phytosanitary.enabled) {
        for (const day of formData.phytosanitary.dailyRecords || []) {
          for (const p of day.phytosanitaries || []) {
            const prod = availablePhytosanitaries.find(x => x._id === p.productId)
            const unitPrice = Number(prod?.pricePerUnit ?? p.price ?? 0)
            if (prod) {
              const qtyConverted = convertAmount(
                Number(p.phytosanitaryAmount || 0),
                (p.phytosanitaryUnit as any) || (prod.unit as any) || 'L',
                (prod.unit as any) || 'L',
              )
              totalCost += Number(qtyConverted || 0) * unitPrice
              // Añadir a consumos para ajuste de inventario en backend
              consumedProducts.push({
                productId: prod._id,
                productName: prod.name,
                amount: Number(qtyConverted || 0),
                unit: prod.unit as any,
              })
            } else {
              const qty = Number(p.phytosanitaryAmount || 0)
              totalCost += qty * unitPrice
            }
          }
        }
      }

      totalCost += Number(formData.energy.cost || 0)

      const activityData = {
        ...formData,
        totalCost,
        consumedProducts,
        createdAt: new Date().toISOString(),
      }

      await onSubmit(activityData)
      try {
        const ids = (activityData.consumedProducts || []).map((c: any) => c.productId)
        if (ids.length > 0) {
          const res = await inventoryAPI.getByProducts(ids)
          const itemsMap: Record<string, { _id: string; currentStock: number; unit: string }> = (res as any)?.items || {}
          for (const c of activityData.consumedProducts || []) {
            const inv = itemsMap[c.productId]
            if (inv && inv._id && Number(c.amount) > 0) {
              await inventoryAPI.adjustStock(inv._id, Number(c.amount), 'subtract', c.unit)
            }
          }
        }
      } catch {}
      setAriaStatus('Actividad creada correctamente')

      // Reset
      setFormData(prev => ({
        ...prev,
        name: '',
        cropType: '',
        plantCount: 0,
        area: 0,
        transplantDate: '',
        sigpacReference: '',
        photos: [],
        fertigation: { enabled: false, dailyRecords: [], notes: '' },
        phytosanitary: { enabled: false, dailyRecords: [], notes: '' },
        water: { enabled: false, waterSource: '', irrigationType: '', dailyRecords: [], notes: '' },
        energy: { enabled: false, energyType: '', dailyConsumption: 0, energyUnit: 'kWh', cost: 0, notes: '' },
        location: '',
        weather: '',
        notes: '',
        status: 'planning',
        priority: 'medium',
        totalCost: 0,
        cycleId: '',
        dayNumber: 0,
      }))
      setErrors({})
    } catch (error) {
      console.error('Error submitting activity:', error)
      setAriaStatus('Error al crear la actividad')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    const newPhotos: string[] = []
    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = evt => {
        if (evt.target?.result) {
          newPhotos.push(evt.target.result as string)
          if (newPhotos.length === files.length) {
            setFormData(prev => ({ ...prev, photos: [...prev.photos, ...newPhotos] }))
          }
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const removePhoto = (index: number) => {
    setFormData(prev => ({ ...prev, photos: prev.photos.filter((_, i) => i !== index) }))
  }

  const handleResourceToggle = (section: 'fertigation' | 'phytosanitary' | 'water' | 'energy') => {
    setFormData(prev => ({ ...prev, [section]: { ...prev[section], enabled: !prev[section].enabled } }))
  }

  const handleResourceChange = (
    section: 'fertigation' | 'phytosanitary' | 'water' | 'energy',
    field: string,
    value: any,
  ) => {
    setFormData(prev => ({ ...prev, [section]: { ...prev[section], [field]: value } }))
  }

  const addFertigationRecord = () => {
    const newRecord: DailyFertigationRecord = {
      date: new Date().toISOString().split('T')[0],
      fertilizers: [
        {
          fertilizerType: '',
          fertilizerAmount: 0,
          fertilizerUnit: (() => {
            try {
              return localStorage.getItem('defaults:fertilizerUnit') || 'kg'
            } catch {
              return 'kg'
            }
          })(),
          cost: 0,
          notes: '',
        } as any,
      ],
      waterConsumption: 0,
      waterUnit: 'm3',
      totalCost: 0,
      notes: '',
    }
    setFormData(prev => ({
      ...prev,
      fertigation: { ...prev.fertigation, dailyRecords: [...prev.fertigation.dailyRecords, newRecord] },
    }))
  }

  const addFertilizerToRecord = (recordIndex: number) => {
    const newFertilizer: FertilizerRecord = {
      fertilizerType: '',
      fertilizerAmount: 0,
      fertilizerUnit: (() => {
        try {
          return localStorage.getItem('defaults:fertilizerUnit') || 'kg'
        } catch {
          return 'kg'
        }
      })(),
      cost: 0,
      notes: '',
    } as any

    setFormData(prev => ({
      ...prev,
      fertigation: {
        ...prev.fertigation,
        dailyRecords: prev.fertigation.dailyRecords.map((record, i) =>
          i === recordIndex
            ? {
                ...record,
                fertilizers: [...record.fertilizers, newFertilizer],
                totalCost: record.fertilizers.reduce((sum, f) => sum + Number(f.cost || 0), 0) + Number(newFertilizer.cost || 0),
              }
            : record,
        ),
      },
    }))
  }

  const updateFertigationRecord = (recordIndex: number, field: keyof DailyFertigationRecord, value: any) => {
    setFormData(prev => ({
      ...prev,
      fertigation: {
        ...prev.fertigation,
        dailyRecords: prev.fertigation.dailyRecords.map((record, i) => (i === recordIndex ? { ...record, [field]: value } : record)),
      },
    }))
  }

  const updateFertilizer = (
    recordIndex: number,
    fertilizerIndex: number,
    field: keyof FertilizerRecord | 'productId' | 'pricePerUnit' | 'brand' | 'supplier' | 'purchaseDate',
    value: any,
  ) => {
    setFormData(prev => ({
      ...prev,
      fertigation: {
        ...prev.fertigation,
        dailyRecords: prev.fertigation.dailyRecords.map((record, i) => {
          if (i !== recordIndex) return record
          const newFertilizers = record.fertilizers.map((fertilizer: any, j) =>
            j === fertilizerIndex ? { ...fertilizer, [field]: value } : fertilizer,
          )
          const newTotalCost = newFertilizers.reduce((sum: number, f: any) => sum + Number(f.cost || 0), 0)
          return {
            ...record,
            fertilizers: newFertilizers,
            totalCost: newTotalCost,
          }
        }),
      },
    }))
  }

  const removeFertilizer = (recordIndex: number, fertilizerIndex: number) => {
    setFormData(prev => ({
      ...prev,
      fertigation: {
        ...prev.fertigation,
        dailyRecords: prev.fertigation.dailyRecords.map((record, i) =>
          i === recordIndex
            ? {
                ...record,
                fertilizers: record.fertilizers.filter((_, j) => j !== fertilizerIndex),
                totalCost: record.fertilizers.filter((_, j) => j !== fertilizerIndex).reduce((sum: number, f: any) => sum + Number(f.cost || 0), 0),
              }
            : record,
        ),
      },
    }))
  }

  const removeFertigationRecord = (index: number) => {
    setFormData(prev => ({
      ...prev,
      fertigation: { ...prev.fertigation, dailyRecords: prev.fertigation.dailyRecords.filter((_, i) => i !== index) },
    }))
  }

  // === Phytosanitary helpers ===
  const addPhytosanitaryToRecord = (recordIndex: number) => {
    const newItem = {
      productId: '',
      phytosanitaryType: '',
      phytosanitaryAmount: 0,
      phytosanitaryUnit: (() => {
        try {
          return localStorage.getItem('defaults:phytosanitaryUnit') || 'L'
        } catch {
          return 'L'
        }
      })(),
      price: 0,
      unit: 'L',
      brand: '',
      supplier: '',
      purchaseDate: '',
      cost: 0,
    }
    setFormData(prev => ({
      ...prev,
      phytosanitary: {
        ...prev.phytosanitary,
        dailyRecords: prev.phytosanitary.dailyRecords.map((r, i) =>
          i === recordIndex ? { ...r, phytosanitaries: [...(r.phytosanitaries || []), newItem] } : r,
        ),
      },
    }))
  }

  const updatePhytosanitary = (
    recordIndex: number,
    itemIndex: number,
    field: keyof DailyPhytosanitaryRecord['phytosanitaries'][number],
    value: any,
  ) => {
    setFormData(prev => ({
      ...prev,
      phytosanitary: {
        ...prev.phytosanitary,
        dailyRecords: prev.phytosanitary.dailyRecords.map((r, i) =>
          i === recordIndex
            ? {
                ...r,
                phytosanitaries: (r.phytosanitaries || []).map((p, j) => (j === itemIndex ? { ...p, [field]: value } : p)),
              }
            : r,
        ),
      },
    }))
  }

  const removePhytosanitary = (recordIndex: number, itemIndex: number) => {
    setFormData(prev => ({
      ...prev,
      phytosanitary: {
        ...prev.phytosanitary,
        dailyRecords: prev.phytosanitary.dailyRecords.map((r, i) =>
          i === recordIndex ? { ...r, phytosanitaries: (r.phytosanitaries || []).filter((_, j) => j !== itemIndex) } : r,
        ),
      },
    }))
  }

  const handlePhytosanitaryTypeChangeInline = async (recordIndex: number, itemIndex: number, productId: string) => {
    const product = availablePhytosanitaries.find(p => p._id === productId)
    if (!product) {
      updatePhytosanitary(recordIndex, itemIndex, 'phytosanitaryType', '')
      updatePhytosanitary(recordIndex, itemIndex, 'productId', '')
      return
    }
    const current = formData.phytosanitary.dailyRecords[recordIndex]?.phytosanitaries?.[itemIndex]
    const price = Number(product.pricePerUnit) || 0
    const convertedAmount = convertAmount(
      Number(current?.phytosanitaryAmount || 0),
      (current?.phytosanitaryUnit as any) || 'L',
      (product.unit as any) || 'L',
    )
    const newCost = Number(convertedAmount || 0) * price
    updatePhytosanitary(recordIndex, itemIndex, 'phytosanitaryType', product.name)
    updatePhytosanitary(recordIndex, itemIndex, 'productId', product._id)
    updatePhytosanitary(recordIndex, itemIndex, 'price', price)
    updatePhytosanitary(recordIndex, itemIndex, 'unit', (product.unit as any) || 'L')
    updatePhytosanitary(recordIndex, itemIndex, 'cost', newCost)

    try {
      const purchases = await purchaseAPI.getByProduct(product._id)
      const arr: any[] = Array.isArray(purchases) ? purchases : Array.isArray((purchases as any)?.purchases) ? (purchases as any).purchases : []
      if (arr.length > 0) {
        arr.sort((a: any, b: any) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime())
        const last = arr[0]
        updatePhytosanitary(recordIndex, itemIndex, 'brand', last.brand || '')
        updatePhytosanitary(recordIndex, itemIndex, 'supplier', last.supplier || '')
        updatePhytosanitary(recordIndex, itemIndex, 'purchaseDate', last.purchaseDate || '')
      }
    } catch {
      // silencioso
    }
    await loadStockFor([product._id])
  }

  const handlePhytosanitaryAmountChangeInline = (recordIndex: number, itemIndex: number, value: number) => {
    const current = formData.phytosanitary.dailyRecords[recordIndex]?.phytosanitaries?.[itemIndex]
    if (!current) return
    updatePhytosanitary(recordIndex, itemIndex, 'phytosanitaryAmount', value)
    const product = current.productId ? availablePhytosanitaries.find(p => p._id === current.productId) : undefined
    const unitPrice = Number(current.price || product?.pricePerUnit || 0)
    const convertedAmount = product
      ? convertAmount(Number(value || 0), (current.phytosanitaryUnit as any) || 'L', (product.unit as any) || 'L')
      : Number(value || 0)
    if (unitPrice) updatePhytosanitary(recordIndex, itemIndex, 'cost', Number(convertedAmount || 0) * unitPrice)
  }

  // Inventario
  const loadStockFor = async (productIds: string[]) => {
    try {
      const ids = Array.from(new Set((productIds || []).filter(Boolean)))
      if (ids.length === 0) return
      const res = await inventoryAPI.getByProducts(ids)
      const itemsMap: Record<
        string,
        { _id: string; currentStock: number; unit: string; minStock?: number; criticalStock?: number }
      > = (res && (res as any).items) || {}
      setStockByProduct(prev => {
        const next = { ...prev }
        for (const id of ids) {
          const it = itemsMap[id]
          next[id] = {
            stock: Number(it?.currentStock) || 0,
            unit: it?.unit || prev[id]?.unit || 'kg',
            minStock: (it as any)?.minStock,
            criticalStock: (it as any)?.criticalStock,
          }
        }
        return next
      })
      setInventoryLastSyncAt(Date.now())
    } catch {
      // silencioso
    }
  }

  const revalidateFertigationStock = async () => {
    try {
      const ids = (formData.fertigation.dailyRecords || [])
        .flatMap(r => r.fertilizers.map((f: any) => f.productId).filter(Boolean)) as string[]
      await loadStockFor(ids)
    } catch {}
  }

  const revalidatePhytosanitaryStock = async () => {
    try {
      const ids = (formData.phytosanitary.dailyRecords || [])
        .flatMap(r => (r.phytosanitaries || []).map((p: any) => p.productId).filter(Boolean)) as string[]
      await loadStockFor(ids)
    } catch {}
  }

  // Cargar catálogos
  useEffect(() => {
    const loadData = async () => {
      if (!isOpen) return
      try {
        const [fertilizersRes, phytoRes, suppliersRes] = await Promise.all([
          productAPI.getByType('fertilizer'),
          productAPI.getByType('phytosanitary'),
          supplierAPI.getAll(),
        ])
        const ferts: any[] = (fertilizersRes as any)?.products || (fertilizersRes as any) || []
        const phytos: any[] = (phytoRes as any)?.products || (phytoRes as any) || []
        const sups: any[] = (suppliersRes as any)?.suppliers || (suppliersRes as any) || []
        setAvailableFertilizers(Array.isArray(ferts) ? (ferts as ProductPrice[]) : [])
        setAvailablePhytosanitaries(Array.isArray(phytos) ? (phytos as ProductPrice[]) : [])
        setAvailableSuppliers(Array.isArray(sups) ? (sups as Supplier[]) : [])
        await loadStockFor((ferts as ProductPrice[]).map(p => p._id))
      } catch (e) {
        console.error('Error cargando datos:', e)
        setAvailableFertilizers([])
        setAvailablePhytosanitaries([])
        setAvailableSuppliers([])
      }
    }
    loadData()
  }, [isOpen])

  const handleNumberFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (e.target.value === '0') e.target.select()
  }

  const handleFertilizerTypeChange = async (recordIndex: number, fertilizerIndex: number, value: string) => {
    const product = availableFertilizers.find(p => p._id === value)
    const current = (formData.fertigation.dailyRecords[recordIndex]?.fertilizers as any)[fertilizerIndex]
    if (product && current) {
      const convertedAmount = convertAmount(
        Number(current.fertilizerAmount || 0),
        (current.fertilizerUnit as any) || 'kg',
        (product.unit as any) || 'kg',
      )
      const newCost = Number(convertedAmount || 0) * Number(product.pricePerUnit || 0)
      updateFertilizer(recordIndex, fertilizerIndex, 'fertilizerType', product.name as any)
      updateFertilizer(recordIndex, fertilizerIndex, 'productId', product._id as any)
      updateFertilizer(recordIndex, fertilizerIndex, 'pricePerUnit', product.pricePerUnit as any)
      updateFertilizer(recordIndex, fertilizerIndex, 'cost', newCost as any)
      try {
        const purchases = await purchaseAPI.getByProduct(product._id)
        const arr: ProductPurchase[] = Array.isArray(purchases)
          ? (purchases as ProductPurchase[])
          : Array.isArray((purchases as any)?.purchases)
          ? ((purchases as any).purchases as ProductPurchase[])
          : []
        const last = arr.sort(
          (a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime(),
        )[0]
        if (last) {
          updateFertilizer(recordIndex, fertilizerIndex, 'brand', last.brand as any)
          updateFertilizer(recordIndex, fertilizerIndex, 'supplier', last.supplier as any)
          updateFertilizer(recordIndex, fertilizerIndex, 'purchaseDate', last.purchaseDate as any)
        }
      } catch (e) {
        console.error('Error cargando compras del producto:', e)
      }
      await loadStockFor([product._id])
    } else {
      updateFertilizer(recordIndex, fertilizerIndex, 'fertilizerType', value as any)
    }
  }

  const handleFertilizerAmountChange = (recordIndex: number, fertilizerIndex: number, value: number) => {
    const current: any = formData.fertigation.dailyRecords[recordIndex]?.fertilizers[fertilizerIndex]
    updateFertilizer(recordIndex, fertilizerIndex, 'fertilizerAmount', value as any)
    if (current?.pricePerUnit && current?.productId) {
      const product = availableFertilizers.find(p => p._id === current.productId)
      const convertedAmount = product
        ? convertAmount(Number(value || 0), (current.fertilizerUnit as any) || 'kg', (product.unit as any) || 'kg')
        : Number(value || 0)
      const newCost = Number(convertedAmount || 0) * Number(current.pricePerUnit || 0)
      updateFertilizer(recordIndex, fertilizerIndex, 'cost', newCost as any)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto" role="dialog" aria-modal="true" aria-label="Nueva Actividad">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />

      {/* Modal */}
      <div
        className={`relative w-full max-w-4xl my-8 rounded-xl shadow-2xl transition-colors ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Nueva Actividad</h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="sr-only" aria-live="polite">
          {[...Object.values(errors || {}).filter(Boolean), ariaStatus].filter(Boolean).join('. ')}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6" aria-label="Formulario Nueva Actividad" aria-describedby="section-basic-info" aria-busy={isSubmitting}>
          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
            {/* INFORMACIÓN BÁSICA */}
            <div className="space-y-4">
              <h3 id="section-basic-info" className={`text-lg font-semibold flex items-center space-x-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                <Leaf className="h-5 w-5 text-green-600" />
                <span>Información Básica</span>
              </h3>

              {/* Nombre y Tipo de Cultivo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Nombre de la Actividad *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => handleInputChange('name', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg transition-colors ${
                      errors.name ? 'border-red-500' : isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? 'activity_name_error' : undefined}
                    placeholder="Ej: Siembra de tomates en invernadero"
                  />
                  {errors.name && <p id="activity_name_error" className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Tipo de Cultivo</label>
                  <input
                    type="text"
                    value={formData.cropType}
                    onChange={e => handleInputChange('cropType', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg transition-colors ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    placeholder="Ej: Tomate, Pimiento, Pepino..."
                  />
                </div>
              </div>

              {/* Número de Plantas y Fecha */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Número de Plantas</label>
                  <input
                    type="number"
                    value={formData.plantCount}
                    onChange={e => handleInputChange('plantCount', parseInt(e.target.value) || 0)}
                    onFocus={handleNumberFocus}
                    className={`w-full px-3 py-2 border rounded-lg transition-colors ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Fecha de Transplante</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="date"
                      value={formData.transplantDate}
                      onChange={e => handleInputChange('transplantDate', e.target.value)}
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg transition-colors ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    />
                  </div>
                </div>
              </div>

              {/* Extensión */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Extensión *</label>
                <div className="flex space-x-2 max-w-md">
                  <input
                    type="number"
                    step="0.01"
                    value={formData.area}
                    onChange={e => handleInputChange('area', parseFloat(e.target.value) || 0)}
                    onFocus={handleNumberFocus}
                    className={`flex-1 px-3 py-2 border rounded-lg transition-colors ${
                      errors.area ? 'border-red-500' : isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    aria-invalid={Boolean(errors.area)}
                    aria-describedby={errors.area ? 'activity_area_error' : undefined}
                    placeholder="0.00"
                  />
                  <select
                    value={formData.areaUnit}
                    onChange={e => handleInputChange('areaUnit', e.target.value)}
                    className={`px-4 py-2 border rounded-lg transition-colors ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  >
                    <option value="ha">ha</option>
                    <option value="m2">m²</option>
                  </select>
                </div>
                {errors.area && <p id="activity_area_error" className="text-red-500 text-sm mt-1">{errors.area}</p>}
              </div>

              {/* SIGPAC y Agrupación */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Referencia SIGPAC</label>
                  <input
                    type="text"
                    value={formData.sigpacReference}
                    onChange={e => handleInputChange('sigpacReference', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg transition-colors ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    placeholder="Ej: ES123456789012"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>ID del Ciclo (Opcional)</label>
                  <input
                    type="text"
                    value={formData.cycleId}
                    onChange={e => handleInputChange('cycleId', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg transition-colors ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    placeholder="Ej: calabazas-2025-01"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Número de Día (Opcional)</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.dayNumber}
                    onChange={e => handleInputChange('dayNumber', parseInt(e.target.value) || 0)}
                    onFocus={handleNumberFocus}
                    className={`w-full px-3 py-2 border rounded-lg transition-colors ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    placeholder="1, 2, 3..."
                  />
                </div>
              </div>
            </div>

            {/* DOCUMENTACIÓN */}
            <div className="space-y-4">
              <h3 className={`text-lg font-semibold flex items-center space-x-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                <ImageIcon className="h-5 w-5 text-blue-600" />
                <span>Documentación</span>
              </h3>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Fotografías de la Actividad</label>
                <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${isDarkMode ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'}`}>
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
                    Arrastra y suelta las fotos aquí, o{' '}
                    <button type="button" onClick={() => document.getElementById('photo-upload')?.click()} className="text-blue-600 hover:text-blue-500 font-medium">
                      selecciona archivos
                    </button>
                  </p>
                  <p className="text-xs text-gray-500 mt-2">PNG, JPG hasta 10MB cada una</p>
                  <input id="photo-upload" type="file" multiple accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </div>

                {formData.photos.length > 0 && (
                  <div className="mt-4">
                    <h4 className={`text-sm font-medium mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Fotos subidas ({formData.photos.length})</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {formData.photos.map((photo, index) => (
                        <div key={index} className="relative group">
                          <img src={photo} alt={`Foto ${index + 1}`} className="w-full h-24 object-cover rounded-lg" />
                          <button
                            type="button"
                            onClick={() => removePhoto(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* GESTIÓN DE RECURSOS */}
            <div className="space-y-4">
              <h3 className={`text-lg font-semibold flex items-center space-x-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                <Droplets className="h-5 w-5 text-cyan-600" />
                <span>Gestión de Recursos</span>
              </h3>

              {/* FERTIRRIEGO */}
              <div className={`border rounded-lg p-4 ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className={`font-medium flex items-center space-x-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    <Leaf className="h-4 w-4 text-green-600" />
                    <span>Fertirriego - Registro Diario</span>
                  </h4>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" checked={formData.fertigation.enabled} onChange={() => handleResourceToggle('fertigation')} className="rounded border-gray-300 text-green-600 focus:ring-green-500" />
                    <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} text-sm`}>Habilitar</span>
                  </label>
                </div>

                {formData.fertigation.enabled && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-xs">
                      {inventoryLastSyncAt && <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Inventario sincronizado {new Date(inventoryLastSyncAt).toLocaleTimeString()}</span>}
                      <button type="button" onClick={revalidateFertigationStock} className={`${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'} px-2 py-1 rounded`}>Revalidar inventario</button>
                    </div>

                    <button
                      type="button"
                      onClick={addFertigationRecord}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${isDarkMode ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}
                    >
                      <Plus className="h-4 w-4" />
                      <span>Agregar Registro Diario</span>
                    </button>

                    {formData.fertigation.dailyRecords.length > 0 && (
                      <div className="space-y-3">
                        <h5 className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Registros ({formData.fertigation.dailyRecords.length})</h5>

                        {formData.fertigation.dailyRecords.map((record, recordIndex) => (
                          <div key={recordIndex} className={`p-4 rounded-lg border ${isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                            <div className="flex items-center justify-between mb-3">
                              <h6 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Registro {recordIndex + 1} - {record.date}</h6>
                              <div className="flex items-center space-x-2">
                                <button type="button" onClick={() => addFertilizerToRecord(recordIndex)} className="flex items-center space-x-1 px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors">
                                  <Plus className="h-3 w-3" />
                                  <span>+ Fertilizante</span>
                                </button>
                                <button type="button" onClick={() => removeFertigationRecord(recordIndex)} className="text-red-500 hover:text-red-700">
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>

                            {/* Fertilizantes */}
                            <div className="mb-4">
                              <h6 className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Fertilizantes ({record.fertilizers.length})</h6>

                              {record.fertilizers.map((fertilizer: any, fertilizerIndex: number) => (
                                <div key={fertilizerIndex} className={`p-3 rounded border mb-2 ${isDarkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-white'}`}>
                                  <div className="flex items-center justify-between mb-2">
                                    <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Fertilizante {fertilizerIndex + 1}</span>
                                    {record.fertilizers.length > 1 && (
                                      <button type="button" onClick={() => removeFertilizer(recordIndex, fertilizerIndex)} className="text-red-500 hover:text-red-700">
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    )}
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                                    <div>
                                      <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Tipo</label>
                                      <select
                                        value={fertilizer.productId || ''}
                                        onChange={e => handleFertilizerTypeChange(recordIndex, fertilizerIndex, e.target.value)}
                                        className={`w-full px-2 py-1 text-sm border rounded transition-colors ${isDarkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                      >
                                        <option value="">Seleccionar fertilizante...</option>
                                        {availableFertilizers.map(product => (
                                          <option key={product._id} value={product._id}>
                                            {product.name}{product.brand ? ` · ${product.brand}` : ''} - {formatCurrencyEUR(Number(product.pricePerUnit))}/{product.unit}
                                          </option>
                                        ))}
                                      </select>
                                      {fertilizer.productId && (
                                        <div className="mt-1">
                                          <StockBadge info={stockByProduct[fertilizer.productId]} isDarkMode={isDarkMode} />
                                        </div>
                                      )}
                                    </div>

                                    <div className="flex space-x-1">
                                      <div className="flex-1">
                                        <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Cantidad</label>
                                        <input
                                          type="number"
                                          step="0.01"
                                          value={fertilizer.fertilizerAmount}
                                          onChange={e => handleFertilizerAmountChange(recordIndex, fertilizerIndex, parseFloat(e.target.value) || 0)}
                                          onFocus={handleNumberFocus}
                                          className={`w-full px-2 py-1 text-sm border rounded transition-colors ${isDarkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                          placeholder="0.00"
                                        />
                                      </div>
                                      <div className="w-16">
                                        <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Unidad</label>
                                        <select
                                          value={fertilizer.fertilizerUnit}
                                          onChange={e => updateFertilizer(recordIndex, fertilizerIndex, 'fertilizerUnit', e.target.value as any)}
                                          className={`w-full px-2 py-1 text-sm border rounded transition-colors ${isDarkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                        >
                                          <option value="kg">kg</option>
                                          <option value="g">g</option>
                                          <option value="L">L</option>
                                          <option value="ml">ml</option>
                                        </select>
                                      </div>
                                    </div>

                                    <div>
                                      <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Coste (€)</label>
                                      <input
                                        type="number"
                                        step="0.01"
                                        value={fertilizer.cost || 0}
                                        onChange={e => updateFertilizer(recordIndex, fertilizerIndex, 'cost', parseFloat(e.target.value) || 0)}
                                        onFocus={handleNumberFocus}
                                        className={`w-full px-2 py-1 text-sm border rounded transition-colors ${isDarkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                        placeholder="0.00"
                                      />
                                    </div>

                                    <div>
                                      <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Notas</label>
                                      <input
                                        type="text"
                                        value={fertilizer.notes || ''}
                                        onChange={e => updateFertilizer(recordIndex, fertilizerIndex, 'notes', e.target.value as any)}
                                        className={`w-full px-2 py-1 text-sm border rounded transition-colors ${isDarkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                        placeholder="Observaciones..."
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Agua y total */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div className="flex space-x-1">
                                <div className="flex-1">
                                  <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Consumo Agua</label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={record.waterConsumption}
                                    onChange={e => updateFertigationRecord(recordIndex, 'waterConsumption', parseFloat(e.target.value) || 0)}
                                    onFocus={handleNumberFocus}
                                    className={`w-full px-2 py-1 text-sm border rounded transition-colors ${isDarkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                    placeholder="0.00"
                                  />
                                </div>
                                <div className="w-16">
                                  <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Unidad</label>
                                  <select
                                    value={record.waterUnit}
                                    onChange={e => updateFertigationRecord(recordIndex, 'waterUnit', e.target.value as any)}
                                    className={`w-full px-2 py-1 text-sm border rounded transition-colors ${isDarkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                  >
                                    <option value="m3">m³</option>
                                    <option value="L">L</option>
                                    <option value="gal">gal</option>
                                  </select>
                                </div>
                              </div>

                              <div>
                                <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Coste Total (€)</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={record.totalCost}
                                  readOnly
                                  className={`w-full px-2 py-1 text-sm border rounded transition-colors ${isDarkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                  placeholder="0.00"
                                />
                              </div>

                              <div>
                                <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Notas del Día</label>
                                <input
                                  type="text"
                                  value={record.notes || ''}
                                  onChange={e => updateFertigationRecord(recordIndex, 'notes', e.target.value)}
                                  className={`w-full px-2 py-1 text-sm border rounded transition-colors ${isDarkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                  placeholder="Observaciones del día..."
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Notas generales */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Notas Generales</label>
                      <textarea
                        value={formData.fertigation.notes}
                        onChange={e => handleResourceChange('fertigation', 'notes', e.target.value)}
                        rows={2}
                        className={`w-full px-3 py-2 border rounded-lg transition-colors ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                        placeholder="Observaciones generales sobre fertirriego..."
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* FITOSANITARIOS */}
              <div className={`border rounded-lg p-4 ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className={`font-medium flex items-center space-x-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    <Shield className="h-4 w-4 text-orange-600" />
                    <span>Tratamientos Fitosanitarios</span>
                  </h4>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" checked={formData.phytosanitary.enabled} onChange={() => handleResourceToggle('phytosanitary')} className="rounded border-gray-300 text-orange-600 focus:ring-orange-500" />
                    <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} text-sm`}>Habilitar</span>
                  </label>
                </div>

                {formData.phytosanitary.enabled && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs">
                      {inventoryLastSyncAt && <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Inventario sincronizado {new Date(inventoryLastSyncAt).toLocaleTimeString()}</span>}
                      <button type="button" onClick={revalidatePhytosanitaryStock} className={`${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'} px-2 py-1 rounded`}>Revalidar inventario</button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const newDay: DailyPhytosanitaryRecord = {
                          date: new Date().toISOString().split('T')[0],
                          phytosanitaries: [],
                          notes: '',
                          totalCost: 0,
                        }
                        setFormData(prev => ({
                          ...prev,
                          phytosanitary: { ...prev.phytosanitary, dailyRecords: [...prev.phytosanitary.dailyRecords, newDay] },
                        }))
                      }}
                      className={`${isDarkMode ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'bg-orange-500 hover:bg-orange-600 text-white'} px-4 py-2 rounded-lg text-sm`}
                    >
                      <Plus className="h-4 w-4 inline mr-2" /> Agregar Registro Diario
                    </button>

                    {formData.phytosanitary.dailyRecords.length > 0 && (
                      <div className="mt-3 space-y-3">
                        {formData.phytosanitary.dailyRecords.map((day, rIdx) => (
                          <div key={rIdx} className={`${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} p-4 rounded-lg border`}>
                            <div className="flex items-center justify-between mb-3">
                              <h6 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Registro {rIdx + 1} - {day.date}</h6>
                              <div className="flex items-center gap-2">
                                <button type="button" onClick={() => addPhytosanitaryToRecord(rIdx)} className={`${isDarkMode ? 'bg-orange-600 hover:bg-orange-700' : 'bg-orange-500 hover:bg-orange-600'} text-white text-xs px-2 py-1 rounded`}>+ Producto</button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setFormData(prev => ({
                                      ...prev,
                                      phytosanitary: {
                                        ...prev.phytosanitary,
                                        dailyRecords: prev.phytosanitary.dailyRecords.filter((_, i) => i !== rIdx),
                                      },
                                    }))
                                  }
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>

                            {(day.phytosanitaries || []).length > 0 && (
                              <div className="space-y-2">
                                {day.phytosanitaries!.map((p, pIdx) => (
                                  <div key={pIdx} className={`p-3 rounded border ${isDarkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-white'}`}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                                      <div>
                                        <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Producto</label>
                                        <select
                                          value={p.productId || ''}
                                          onChange={e => handlePhytosanitaryTypeChangeInline(rIdx, pIdx, e.target.value)}
                                          className={`w-full px-2 py-1 text-sm border rounded transition-colors ${isDarkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                        >
                                          <option value="">Seleccionar fitosanitario...</option>
                                          {availablePhytosanitaries.map(prod => (
                                            <option key={prod._id} value={prod._id}>
                                              {prod.name}{prod.brand ? ` · ${prod.brand}` : ''} - {formatCurrencyEUR(Number(prod.pricePerUnit))}/{prod.unit}
                                            </option>
                                          ))}
                                        </select>
                                        {p.productId && (
                                          <div className="mt-1">
                                            <StockBadge info={stockByProduct[p.productId!]} isDarkMode={isDarkMode} />
                                          </div>
                                        )}
                                      </div>

                                      <div className="flex space-x-1">
                                        <div className="flex-1">
                                          <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Cantidad</label>
                                          <input
                                            type="number"
                                            step="0.01"
                                            value={p.phytosanitaryAmount || 0}
                                            onChange={e => handlePhytosanitaryAmountChangeInline(rIdx, pIdx, parseFloat(e.target.value) || 0)}
                                            onFocus={handleNumberFocus}
                                            className={`w-full px-2 py-1 text-sm border rounded transition-colors ${isDarkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                            placeholder="0.00"
                                          />
                                        </div>
                                        <div className="w-16">
                                          <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Unidad</label>
                                          <select
                                            value={(p.phytosanitaryUnit as any) || 'L'}
                                            onChange={e => updatePhytosanitary(rIdx, pIdx, 'phytosanitaryUnit', e.target.value as any)}
                                            className={`w-full px-2 py-1 text-sm border rounded transition-colors ${isDarkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                          >
                                            <option value="L">L</option>
                                            <option value="ml">ml</option>
                                            <option value="kg">kg</option>
                                            <option value="g">g</option>
                                          </select>
                                        </div>
                                      </div>

                                      <div>
                                        <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Coste (€)</label>
                                        <input
                                          type="number"
                                          step="0.01"
                                          value={Number(p.cost || 0)}
                                          onChange={e => updatePhytosanitary(rIdx, pIdx, 'cost', parseFloat(e.target.value) || 0)}
                                          onFocus={handleNumberFocus}
                                          className={`w-full px-2 py-1 text-sm border rounded transition-colors ${isDarkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                          placeholder="0.00"
                                        />
                                      </div>

                                      <div>
                                        <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Notas</label>
                                        <input
                                          type="text"
                                          value={p.notes || ''}
                                          onChange={e => updatePhytosanitary(rIdx, pIdx, 'notes' as any, e.target.value)}
                                          className={`w-full px-2 py-1 text-sm border rounded transition-colors ${isDarkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                          placeholder="Observaciones..."
                                        />
                                      </div>
                                    </div>

                                    <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
                                      <div>
                                        <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Marca</label>
                                        <input
                                          type="text"
                                          value={p.brand || ''}
                                          onChange={e => updatePhytosanitary(rIdx, pIdx, 'brand', e.target.value)}
                                          className={`w-full px-2 py-1 text-sm border rounded transition-colors ${isDarkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                        />
                                      </div>
                                      <div>
                                        <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Proveedor</label>
                                        <select
                                          value={p.supplier || ''}
                                          onChange={e => updatePhytosanitary(rIdx, pIdx, 'supplier', e.target.value)}
                                          className={`w-full px-2 py-1 text-sm border rounded transition-colors ${isDarkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                        >
                                          <option value="">Seleccionar proveedor...</option>
                                          {availableSuppliers.map(s => (
                                            <option key={s._id} value={s.name}>{s.name}</option>
                                          ))}
                                        </select>
                                      </div>
                                      <div>
                                        <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Fecha de Compra</label>
                                        <input
                                          type="date"
                                          value={p.purchaseDate || ''}
                                          onChange={e => updatePhytosanitary(rIdx, pIdx, 'purchaseDate', e.target.value)}
                                          className={`w-full px-2 py-1 text-sm border rounded transition-colors ${isDarkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                        />
                                      </div>
                                    </div>

                                    <div className="mt-2">
                                      <button type="button" onClick={() => removePhytosanitary(rIdx, pIdx)} className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1">
                                        <Trash2 className="h-3 w-3" /> Eliminar
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ENERGÍA */}
              <div className={`border rounded-lg p-4 ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className={`font-medium flex items-center space-x-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    <Zap className="h-4 w-4 text-yellow-500" />
                    <span>Energía</span>
                  </h4>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" checked={formData.energy.enabled} onChange={() => handleResourceToggle('energy')} className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500" />
                    <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} text-sm`}>Habilitar</span>
                  </label>
                </div>

                {formData.energy.enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Tipo</label>
                      <input
                        type="text"
                        value={formData.energy.energyType}
                        onChange={e => handleResourceChange('energy', 'energyType', e.target.value)}
                        className={`w-full px-2 py-1 text-sm border rounded ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                        placeholder="Red, generador…"
                      />
                    </div>
                    <div className="flex space-x-1">
                      <div className="flex-1">
                        <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Consumo</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.energy.dailyConsumption}
                          onChange={e => handleResourceChange('energy', 'dailyConsumption', parseFloat(e.target.value) || 0)}
                          onFocus={handleNumberFocus}
                          className={`w-full px-2 py-1 text-sm border rounded ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                        />
                      </div>
                      <div className="w-20">
                        <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Unidad</label>
                        <select
                          value={formData.energy.energyUnit}
                          onChange={e => handleResourceChange('energy', 'energyUnit', e.target.value)}
                          className={`w-full px-2 py-1 text-sm border rounded ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                        >
                          <option value="kWh">kWh</option>
                          <option value="Wh">Wh</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Coste (€)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.energy.cost}
                        onChange={e => handleResourceChange('energy', 'cost', parseFloat(e.target.value) || 0)}
                        onFocus={handleNumberFocus}
                        className={`w-full px-2 py-1 text-sm border rounded ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Notas</label>
                      <input
                        type="text"
                        value={formData.energy.notes}
                        onChange={e => handleResourceChange('energy', 'notes', e.target.value)}
                        className={`w-full px-2 py-1 text-sm border rounded ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Notas y estado */}
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Notas adicionales</label>
                <textarea
                  value={formData.notes}
                  onChange={e => handleInputChange('notes', e.target.value)}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg transition-colors ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  placeholder="Cualquier otra información relevante…"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Estado</label>
                  <select
                    value={formData.status}
                    onChange={e => handleInputChange('status', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg transition-colors ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  >
                    <option value="planning">Planificación</option>
                    <option value="in_progress">En curso</option>
                    <option value="completed">Completada</option>
                    <option value="paused">Pausada</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Prioridad</label>
                  <select
                    value={formData.priority}
                    onChange={e => handleInputChange('priority', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg transition-colors ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  >
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className={`flex items-center justify-end gap-3 p-6 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <button
              type="button"
              onClick={onClose}
              className={`${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'} px-4 py-2 rounded-lg`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 rounded-lg ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'} disabled:opacity-60`}
            >
              {isSubmitting ? 'Guardando…' : 'Guardar actividad'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ActivityFormModal
