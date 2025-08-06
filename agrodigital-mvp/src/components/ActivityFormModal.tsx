import React, { useState, useEffect } from 'react'
import { 
	X, 
	Calendar, 
	Upload, 
	Image, 
	Trash2,
	Leaf,
	Zap,
	Droplets,
	Shield,
	Plus,
	Info
} from 'lucide-react'
import type { FertigationData, PhytosanitaryData, WaterData, EnergyData, DailyFertigationRecord, FertilizerRecord, ActivityStatus, ActivityPriority, ProductPrice, Supplier, ProductPurchase } from '../types'
import { productAPI, supplierAPI, purchaseAPI, inventoryAPI } from '../services/api'

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
	isDarkMode 
}) => {
	const [formData, setFormData] = useState({
		// Información básica
		name: '',
		cropType: '',
		plantCount: 0,
		area: 0,
		areaUnit: 'ha' as 'ha' | 'm2',
		transplantDate: '',
		sigpacReference: '',
		
		// Documentación
		photos: [] as string[],
		
		// Gestión de recursos
		fertigation: {
			enabled: false,
			dailyRecords: [],
			notes: ''
		} as FertigationData,
		
		phytosanitary: {
			enabled: false,
			treatmentType: '',
			productName: '',
			applicationDate: '',
			dosage: '',
			notes: ''
		} as PhytosanitaryData,
		
		water: {
			enabled: false,
			waterSource: '',
			irrigationType: '',
			dailyConsumption: 0,
			waterUnit: 'L',
			cost: 0,
			notes: ''
		} as WaterData,
		
		energy: {
			enabled: false,
			energyType: '',
			dailyConsumption: 0,
			energyUnit: 'kWh',
			cost: 0,
			notes: ''
		} as EnergyData,
		
		// Información adicional
		location: '',
		weather: '',
		notes: '',
		status: 'planning' as ActivityStatus,
		priority: 'medium' as ActivityPriority,
		totalCost: 0,
		
		// Campos de agrupación (opcionales)
		cycleId: '',
		dayNumber: 0
	})

	const [isSubmitting, setIsSubmitting] = useState(false)
	const [availableFertilizers, setAvailableFertilizers] = useState<ProductPrice[]>([])
	const [availableSuppliers, setAvailableSuppliers] = useState<Supplier[]>([])

	const [errors, setErrors] = useState<{ [key: string]: string }>({})
    const validateForm = async () => {
		const newErrors: { [key: string]: string } = {}

		if (!formData.name.trim()) {
			newErrors.name = 'El nombre de la actividad es requerido'
		}
		if (formData.area <= 0) {
			newErrors.area = 'La extensión debe ser mayor a 0'
		}
		if (formData.totalCost < 0) {
			newErrors.totalCost = 'El coste total no puede ser negativo'
		}

		// Validar stock disponible en inventario
		if (formData.fertigation.enabled) {
			for (let recordIndex = 0; recordIndex < formData.fertigation.dailyRecords.length; recordIndex++) {
				const record = formData.fertigation.dailyRecords[recordIndex]
				for (let fertilizerIndex = 0; fertilizerIndex < record.fertilizers.length; fertilizerIndex++) {
					const fertilizer = record.fertilizers[fertilizerIndex]
					if (fertilizer.productId) {
						try {
							const inventoryItem = await inventoryAPI.getByProduct(fertilizer.productId)
							if (inventoryItem) {
								if (fertilizer.fertilizerAmount > inventoryItem.currentStock) {
									newErrors[`fertigation_${recordIndex}_${fertilizerIndex}`] = 
										`Stock insuficiente. Disponible: ${inventoryItem.currentStock} ${inventoryItem.unit}`
								}
							} else {
								newErrors[`fertigation_${recordIndex}_${fertilizerIndex}`] = 
									'Producto no disponible en inventario'
							}
						} catch (error) {
							newErrors[`fertigation_${recordIndex}_${fertilizerIndex}`] = 
								'Error verificando inventario'
						}
					}
				}
			}
		}

		// Validar stock de fitosanitarios
		if (formData.phytosanitary.enabled && formData.phytosanitary.productName) {
			const phytosanitaryProduct = Array.isArray(availableFertilizers) ? availableFertilizers.find(p => 
				p.name === formData.phytosanitary.productName && p.type === 'phytosanitary'
			) : undefined
			if (phytosanitaryProduct) {
				try {
					const inventoryItem = await inventoryAPI.getByProduct(phytosanitaryProduct._id)
					const dosage = parseFloat(formData.phytosanitary.dosage || '1') || 1
					
					if (inventoryItem) {
						if (dosage > inventoryItem.currentStock) {
							newErrors.phytosanitary = 
								`Stock insuficiente de ${phytosanitaryProduct.name}. Disponible: ${inventoryItem.currentStock} ${inventoryItem.unit}`
						}
					} else {
						newErrors.phytosanitary = `Producto ${phytosanitaryProduct.name} no disponible en inventario`
					}
				} catch (error) {
					newErrors.phytosanitary = `Error verificando inventario de ${phytosanitaryProduct.name}`
				}
			}
		}

		setErrors(newErrors)
		return Object.keys(newErrors).length === 0
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		
		if (!(await validateForm())) {
			return
		}
		
		setIsSubmitting(true)
		
		try {
			// Calcular costos totales y consumir inventario
			let totalCost = 0
			const consumedProducts: Array<{productId: string, productName: string, amount: number, unit: string}> = []
			
			// Costos de fertigación y consumo de fertilizantes
			if (formData.fertigation.enabled) {
				for (const record of formData.fertigation.dailyRecords) {
					for (const fertilizer of record.fertilizers) {
						if (fertilizer.productId) {
							const product = Array.isArray(availableFertilizers) ? availableFertilizers.find(p => p._id === fertilizer.productId) : undefined
							if (product) {
								totalCost += (fertilizer.fertilizerAmount * product.pricePerUnit)
								
								// Consumir del inventario
								try {
									const inventoryItem = await inventoryAPI.getByProduct(fertilizer.productId)
									if (inventoryItem) {
										await inventoryAPI.adjustStock(fertilizer.productId, fertilizer.fertilizerAmount, 'subtract')
										consumedProducts.push({
											productId: fertilizer.productId,
											productName: fertilizer.fertilizerType,
											amount: fertilizer.fertilizerAmount,
											unit: fertilizer.fertilizerUnit
										})
									}
								} catch (error) {
									console.error('Error ajustando inventario:', error)
								}
							}
						}
					}
				}
			}
			
			// Costos de fitosanitarios y consumo
			if (formData.phytosanitary.enabled && formData.phytosanitary.productName) {
				const phytosanitaryProduct = Array.isArray(availableFertilizers) ? availableFertilizers.find(p => 
					p.name === formData.phytosanitary.productName && p.type === 'phytosanitary'
				) : undefined
				if (phytosanitaryProduct) {
					// Calcular dosis (simplificado - asumimos 1 unidad por aplicación)
					const dosage = parseFloat(formData.phytosanitary.dosage || '1') || 1
					totalCost += (phytosanitaryProduct.pricePerUnit * dosage)
					
					// Consumir del inventario
					try {
						const inventoryItem = await inventoryAPI.getByProduct(phytosanitaryProduct._id)
						if (inventoryItem) {
							await inventoryAPI.adjustStock(phytosanitaryProduct._id, dosage, 'subtract')
							consumedProducts.push({
								productId: phytosanitaryProduct._id,
								productName: phytosanitaryProduct.name,
								amount: dosage,
								unit: phytosanitaryProduct.unit
							})
						}
					} catch (error) {
						console.error('Error ajustando inventario de fitosanitarios:', error)
					}
				}
			}
			
			// Costos de agua y energía
			totalCost += (formData.water.cost || 0) + (formData.energy.cost || 0)
			
			const activityData = {
				...formData,
				totalCost,
				consumedProducts, // Añadir información de productos consumidos
				createdAt: new Date().toISOString()
			}
			
			await onSubmit(activityData)
			
			// Resetear formulario después del envío exitoso
			setFormData({
				// Información básica
				name: '',
				cropType: '',
				plantCount: 0,
				area: 0,
				areaUnit: 'ha' as 'ha' | 'm2',
				transplantDate: '',
				sigpacReference: '',
				
				// Documentación
				photos: [],
				
				// Gestión de recursos
				fertigation: {
					enabled: false,
					dailyRecords: [],
					notes: ''
				},
				
				phytosanitary: {
					enabled: false,
					treatmentType: '',
					productName: '',
					applicationDate: '',
					dosage: '',
					notes: ''
				},
				
				water: {
					enabled: false,
					waterSource: '',
					irrigationType: '',
					dailyConsumption: 0,
					waterUnit: 'L',
					cost: 0,
					notes: ''
				},
				
				energy: {
					enabled: false,
					energyType: '',
					dailyConsumption: 0,
					energyUnit: 'kWh',
					cost: 0,
					notes: ''
				},
				
				// Información adicional
				location: '',
				weather: '',
				notes: '',
				status: 'planning' as ActivityStatus,
				priority: 'medium' as ActivityPriority,
				totalCost: 0,
				
				// Campos de agrupación (opcionales)
				cycleId: '',
				dayNumber: 0
			})
			setErrors({})
		} catch (error) {
			console.error('Error submitting activity:', error)
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleInputChange = (field: string, value: string | number) => {
		setFormData(prev => ({ ...prev, [field]: value }))
		if (errors[field]) {
			setErrors(prev => ({ ...prev, [field]: '' }))
		}
	}

	const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files
		if (files) {
			const newPhotos: string[] = []
			Array.from(files).forEach(file => {
				const reader = new FileReader()
				reader.onload = (e) => {
					if (e.target?.result) {
						newPhotos.push(e.target.result as string)
						if (newPhotos.length === files.length) {
							setFormData(prev => ({
								...prev,
								photos: [...prev.photos, ...newPhotos]
							}))
						}
					}
				}
				reader.readAsDataURL(file)
			})
		}
	}

	const removePhoto = (index: number) => {
		setFormData(prev => ({
			...prev,
			photos: prev.photos.filter((_, i) => i !== index)
		}))
	}

	const handleResourceToggle = (section: 'fertigation' | 'phytosanitary' | 'water' | 'energy') => {
		setFormData(prev => ({
			...prev,
			[section]: {
				...prev[section],
				enabled: !prev[section].enabled
			}
		}))
	}

	const handleResourceChange = (section: 'fertigation' | 'phytosanitary' | 'water' | 'energy', field: string, value: any) => {
		setFormData(prev => ({
			...prev,
			[section]: {
				...prev[section],
				[field]: value
			}
		}))
	}

	const addFertigationRecord = () => {
		const newRecord: DailyFertigationRecord = {
			date: new Date().toISOString().split('T')[0],
			fertilizers: [{
				fertilizerType: '',
				fertilizerAmount: 0,
				fertilizerUnit: 'kg',
				cost: 0,
				notes: ''
			}],
			waterConsumption: 0,
			waterUnit: 'L',
			totalCost: 0,
			notes: ''
		}
		
		setFormData(prev => ({
			...prev,
			fertigation: {
				...prev.fertigation,
				dailyRecords: [...prev.fertigation.dailyRecords, newRecord]
			}
		}))
	}

	const addFertilizerToRecord = (recordIndex: number) => {
		const newFertilizer: FertilizerRecord = {
			fertilizerType: '',
			fertilizerAmount: 0,
			fertilizerUnit: 'kg',
			cost: 0,
			notes: ''
		}
		
		setFormData(prev => ({
			...prev,
			fertigation: {
				...prev.fertigation,
				dailyRecords: prev.fertigation.dailyRecords.map((record, i) => 
					i === recordIndex 
						? { 
							...record, 
							fertilizers: [...record.fertilizers, newFertilizer],
							totalCost: record.fertilizers.reduce((sum, f) => sum + f.cost, 0) + newFertilizer.cost
						} 
						: record
				)
			}
		}))
	}

	const updateFertigationRecord = (recordIndex: number, field: keyof DailyFertigationRecord, value: any) => {
		setFormData(prev => ({
			...prev,
			fertigation: {
				...prev.fertigation,
				dailyRecords: prev.fertigation.dailyRecords.map((record, i) => 
					i === recordIndex ? { ...record, [field]: value } : record
				)
			}
		}))
	}

	const updateFertilizer = (recordIndex: number, fertilizerIndex: number, field: keyof FertilizerRecord, value: any) => {
		setFormData(prev => ({
			...prev,
			fertigation: {
				...prev.fertigation,
				dailyRecords: prev.fertigation.dailyRecords.map((record, i) => 
					i === recordIndex 
						? { 
							...record, 
							fertilizers: record.fertilizers.map((fertilizer, j) => 
								j === fertilizerIndex ? { ...fertilizer, [field]: value } : fertilizer
							),
							totalCost: record.fertilizers.reduce((sum, f) => sum + f.cost, 0)
						} 
						: record
				)
			}
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
							totalCost: record.fertilizers.filter((_, j) => j !== fertilizerIndex).reduce((sum, f) => sum + f.cost, 0)
						} 
						: record
				)
			}
		}))
	}

	const removeFertigationRecord = (index: number) => {
		setFormData(prev => ({
			...prev,
			fertigation: {
				...prev.fertigation,
				dailyRecords: prev.fertigation.dailyRecords.filter((_, i) => i !== index)
			}
		}))
	}

	// Cargar productos disponibles al abrir el modal
	useEffect(() => {
		const loadData = async () => {
			if (isOpen) {
				try {
					// Cargar fertilizantes desde la API
					const fertilizers = await productAPI.getByType('fertilizer')
					setAvailableFertilizers(Array.isArray(fertilizers) ? fertilizers : [])
					
					// Cargar proveedores desde la API
					const suppliers = await supplierAPI.getAll()
					setAvailableSuppliers(Array.isArray(suppliers) ? suppliers : [])
				} catch (error) {
					console.error('Error cargando datos:', error)
					// En caso de error, establecer arrays vacíos
					setAvailableFertilizers([])
					setAvailableSuppliers([])
				}
			}
		}
		
		loadData()
	}, [isOpen])

	// Función para manejar el focus en campos numéricos
	const handleNumberFocus = (e: React.FocusEvent<HTMLInputElement>) => {
		if (e.target.value === '0') {
			e.target.select()
		}
	}

	// Función para calcular coste automáticamente cuando se selecciona un producto
	const handleFertilizerTypeChange = async (recordIndex: number, fertilizerIndex: number, value: string) => {
		const product = Array.isArray(availableFertilizers) ? availableFertilizers.find(p => p._id === value) : undefined
		const currentFertilizer = formData.fertigation.dailyRecords[recordIndex]?.fertilizers[fertilizerIndex]
		
		if (product && currentFertilizer) {
			const newCost = currentFertilizer.fertilizerAmount * product.pricePerUnit
			
			updateFertilizer(recordIndex, fertilizerIndex, 'fertilizerType', product.name)
			updateFertilizer(recordIndex, fertilizerIndex, 'productId', product._id)
			updateFertilizer(recordIndex, fertilizerIndex, 'pricePerUnit', product.pricePerUnit)
			updateFertilizer(recordIndex, fertilizerIndex, 'cost', newCost)
			
			try {
				// Buscar información de la última compra de este producto
				const purchases = await purchaseAPI.getByProduct(product._id)
				const lastPurchase = purchases.sort((a: ProductPurchase, b: ProductPurchase) => 
					new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime()
				)[0]
				
				if (lastPurchase) {
					updateFertilizer(recordIndex, fertilizerIndex, 'brand', lastPurchase.brand)
					updateFertilizer(recordIndex, fertilizerIndex, 'supplier', lastPurchase.supplier)
					updateFertilizer(recordIndex, fertilizerIndex, 'purchaseDate', lastPurchase.purchaseDate)
				}
			} catch (error) {
				console.error('Error cargando compras del producto:', error)
			}
			
			// Verificar stock disponible en inventario
			try {
				const inventoryItem = await inventoryAPI.getByProduct(product._id)
				if (inventoryItem) {
					console.log(`✅ Stock disponible de ${product.name}: ${inventoryItem.currentStock} ${inventoryItem.unit}`)
					if (inventoryItem.currentStock <= inventoryItem.minStock) {
						console.warn(`⚠️ Stock bajo de ${product.name}: ${inventoryItem.currentStock} ${inventoryItem.unit}`)
					}
					if (inventoryItem.currentStock <= inventoryItem.criticalStock) {
						console.error(`🚨 Stock crítico de ${product.name}: ${inventoryItem.currentStock} ${inventoryItem.unit}`)
					}
				} else {
					console.warn(`⚠️ Producto ${product.name} no está en inventario`)
				}
			} catch (error) {
				console.error('Error verificando inventario:', error)
			}
		} else {
			updateFertilizer(recordIndex, fertilizerIndex, 'fertilizerType', value)
		}
	}

	// Función para calcular coste automáticamente cuando cambia la cantidad
	const handleFertilizerAmountChange = (recordIndex: number, fertilizerIndex: number, value: number) => {
		const currentFertilizer = formData.fertigation.dailyRecords[recordIndex]?.fertilizers[fertilizerIndex]
		
		if (currentFertilizer?.pricePerUnit) {
			const newCost = value * currentFertilizer.pricePerUnit
			updateFertilizer(recordIndex, fertilizerIndex, 'fertilizerAmount', value)
			updateFertilizer(recordIndex, fertilizerIndex, 'cost', newCost)
		} else {
			updateFertilizer(recordIndex, fertilizerIndex, 'fertilizerAmount', value)
		}
	}

	if (!isOpen) return null
    return (
		<div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
			{/* Overlay */}
			<div 
				className="fixed inset-0 bg-black bg-opacity-50"
				onClick={onClose}
			/>
			
			{/* Modal */}
			<div className={`relative w-full max-w-4xl my-8 rounded-xl shadow-2xl transition-colors ${
				isDarkMode ? 'bg-gray-800' : 'bg-white'
			}`}>
				{/* Header */}
				<div className={`flex items-center justify-between p-6 border-b ${
					isDarkMode ? 'border-gray-700' : 'border-gray-200'
				}`}>
					<h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
						Nueva Actividad
					</h2>
					<button
						onClick={onClose}
						className={`p-2 rounded-lg transition-colors ${
							isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
						}`}
					>
						<X className="h-5 w-5" />
					</button>
				</div>

				{/* Form */}
				<form onSubmit={handleSubmit} className="p-6">
					<div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
					
					{/* INFORMACIÓN BÁSICA */}
					<div className="space-y-4">
						<h3 className={`text-lg font-semibold flex items-center space-x-2 ${
							isDarkMode ? 'text-white' : 'text-gray-900'
						}`}>
							<Leaf className="h-5 w-5 text-green-600" />
							<span>Información Básica</span>
						</h3>
						
						{/* Nombre y Tipo de Cultivo */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label className={`block text-sm font-medium mb-2 ${
									isDarkMode ? 'text-gray-300' : 'text-gray-700'
								}`}>
									Nombre de la Actividad *
								</label>
								<input
									type="text"
									value={formData.name}
									onChange={(e) => handleInputChange('name', e.target.value)}
									className={`w-full px-3 py-2 border rounded-lg transition-colors ${
										errors.name 
											? 'border-red-500' 
											: isDarkMode 
												? 'bg-gray-700 border-gray-600 text-white' 
												: 'bg-white border-gray-300 text-gray-900'
									}`}
									placeholder="Ej: Siembra de tomates en invernadero"
								/>
								{errors.name && (
									<p className="text-red-500 text-sm mt-1">{errors.name}</p>
								)}
							</div>
							
							<div>
								<label className={`block text-sm font-medium mb-2 ${
									isDarkMode ? 'text-gray-300' : 'text-gray-700'
								}`}>
									Tipo de Cultivo
								</label>
								<input
									type="text"
									value={formData.cropType}
									onChange={(e) => handleInputChange('cropType', e.target.value)}
									className={`w-full px-3 py-2 border rounded-lg transition-colors ${
										isDarkMode 
											? 'bg-gray-700 border-gray-600 text-white' 
											: 'bg-white border-gray-300 text-gray-900'
									}`}
									placeholder="Ej: Tomate, Pimiento, Pepino..."
								/>
							</div>
						</div>
						
						{/* Número de Plantas y Extensión */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label className={`block text-sm font-medium mb-2 ${
									isDarkMode ? 'text-gray-300' : 'text-gray-700'
								}`}>
									Número de Plantas
								</label>
								<input
									type="number"
									value={formData.plantCount}
									onChange={(e) => handleInputChange('plantCount', parseInt(e.target.value) || 0)}
									onFocus={handleNumberFocus}
									className={`w-full px-3 py-2 border rounded-lg transition-colors ${
										isDarkMode 
											? 'bg-gray-700 border-gray-600 text-white' 
											: 'bg-white border-gray-300 text-gray-900'
									}`}
									placeholder="0"
								/>
							</div>
							
							<div>
								<label className={`block text-sm font-medium mb-2 ${
									isDarkMode ? 'text-gray-300' : 'text-gray-700'
								}`}>
									Fecha de Transplante
								</label>
								<div className="relative">
									<Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
									<input
										type="date"
										value={formData.transplantDate}
										onChange={(e) => handleInputChange('transplantDate', e.target.value)}
										className={`w-full pl-10 pr-3 py-2 border rounded-lg transition-colors ${
											isDarkMode 
												? 'bg-gray-700 border-gray-600 text-white' 
												: 'bg-white border-gray-300 text-gray-900'
										}`}
									/>
								</div>
							</div>
						</div>
						
						{/* Extensión - Ahora en su propia fila */}
						<div>
							<label className={`block text-sm font-medium mb-2 ${
								isDarkMode ? 'text-gray-300' : 'text-gray-700'
							}`}>
								Extensión *
							</label>
							<div className="flex space-x-2 max-w-md">
								<input
									type="number"
									step="0.01"
									value={formData.area}
									onChange={(e) => handleInputChange('area', parseFloat(e.target.value) || 0)}
									onFocus={handleNumberFocus}
									className={`flex-1 px-3 py-2 border rounded-lg transition-colors ${
										errors.area 
											? 'border-red-500' 
											: isDarkMode 
												? 'bg-gray-700 border-gray-600 text-white' 
												: 'bg-white border-gray-300 text-gray-900'
									}`}
									placeholder="0.00"
								/>
								<select
									value={formData.areaUnit}
									onChange={(e) => handleInputChange('areaUnit', e.target.value)}
									className={`px-4 py-2 border rounded-lg transition-colors ${
										isDarkMode 
											? 'bg-gray-700 border-gray-600 text-white' 
											: 'bg-white border-gray-300 text-gray-900'
									}`}
								>
									<option value="ha">ha</option>
									<option value="m2">m²</option>
								</select>
							</div>
							{errors.area && (
								<p className="text-red-500 text-sm mt-1">{errors.area}</p>
							)}
						</div>
						
						{/* Referencia SIGPAC */}
						<div>
							<label className={`block text-sm font-medium mb-2 ${
								isDarkMode ? 'text-gray-300' : 'text-gray-700'
							}`}>
								Referencia SIGPAC
							</label>
							<input
								type="text"
								value={formData.sigpacReference}
								onChange={(e) => handleInputChange('sigpacReference', e.target.value)}
								className={`w-full px-3 py-2 border rounded-lg transition-colors ${
									isDarkMode 
										? 'bg-gray-700 border-gray-600 text-white' 
										: 'bg-white border-gray-300 text-gray-900'
								}`}
								placeholder="Ej: ES123456789012"
							/>
						</div>
						
						{/* Campos de Agrupación */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label className={`block text-sm font-medium mb-2 ${
									isDarkMode ? 'text-gray-300' : 'text-gray-700'
								}`}>
									ID del Ciclo (Opcional)
								</label>
								<input
									type="text"
									value={formData.cycleId}
									onChange={(e) => handleInputChange('cycleId', e.target.value)}
									className={`w-full px-3 py-2 border rounded-lg transition-colors ${
										isDarkMode 
											? 'bg-gray-700 border-gray-600 text-white' 
											: 'bg-white border-gray-300 text-gray-900'
									}`}
									placeholder="Ej: calabazas-2024-01"
								/>
								<p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
									Para agrupar actividades del mismo ciclo
								</p>
							</div>
							
							<div>
								<label className={`block text-sm font-medium mb-2 ${
									isDarkMode ? 'text-gray-300' : 'text-gray-700'
								}`}>
									Número de Día (Opcional)
								</label>
								<input
									type="number"
									min="1"
									value={formData.dayNumber}
									onChange={(e) => handleInputChange('dayNumber', parseInt(e.target.value) || 0)}
									onFocus={handleNumberFocus}
									className={`w-full px-3 py-2 border rounded-lg transition-colors ${
										isDarkMode 
											? 'bg-gray-700 border-gray-600 text-white' 
											: 'bg-white border-gray-300 text-gray-900'
									}`}
									placeholder="1, 2, 3..."
								/>
								<p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
									Día del ciclo (1, 2, 3...)
								</p>
							</div>
						</div>
					</div>
                    					{/* DOCUMENTACIÓN */}
					<div className="space-y-4">
						<h3 className={`text-lg font-semibold flex items-center space-x-2 ${
							isDarkMode ? 'text-white' : 'text-gray-900'
						}`}>
							<Image className="h-5 w-5 text-blue-600" />
							<span>Documentación</span>
						</h3>
						
						{/* Subida de Fotos */}
						<div>
							<label className={`block text-sm font-medium mb-2 ${
								isDarkMode ? 'text-gray-300' : 'text-gray-700'
							}`}>
								Fotografías de la Actividad
							</label>
							
							{/* Área de subida */}
							<div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
								isDarkMode 
									? 'border-gray-600 hover:border-gray-500' 
									: 'border-gray-300 hover:border-gray-400'
							}`}>
								<Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
								<p className={`text-sm ${
									isDarkMode ? 'text-gray-400' : 'text-gray-600'
								}`}>
									Arrastra y suelta las fotos aquí, o{' '}
									<button
										type="button"
										onClick={() => document.getElementById('photo-upload')?.click()}
										className="text-blue-600 hover:text-blue-500 font-medium"
									>
										selecciona archivos
									</button>
								</p>
								<p className={`text-xs mt-2 ${
									isDarkMode ? 'text-gray-500' : 'text-gray-500'
								}`}>
									PNG, JPG hasta 10MB cada una
								</p>
								<input
									id="photo-upload"
									type="file"
									multiple
									accept="image/*"
									onChange={handlePhotoUpload}
									className="hidden"
								/>
							</div>
							
							{/* Fotos subidas */}
							{formData.photos.length > 0 && (
								<div className="mt-4">
									<h4 className={`text-sm font-medium mb-3 ${
										isDarkMode ? 'text-gray-300' : 'text-gray-700'
									}`}>
										Fotos subidas ({formData.photos.length})
									</h4>
									<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
										{formData.photos.map((photo, index) => (
											<div key={index} className="relative group">
												<img
													src={photo}
													alt={`Foto ${index + 1}`}
													className="w-full h-24 object-cover rounded-lg"
												/>
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
						<h3 className={`text-lg font-semibold flex items-center space-x-2 ${
							isDarkMode ? 'text-white' : 'text-gray-900'
						}`}>
							<Droplets className="h-5 w-5 text-cyan-600" />
							<span>Gestión de Recursos</span>
						</h3>
						
						{/* Fertirriego */}
						<div className={`border rounded-lg p-4 ${
							isDarkMode ? 'border-gray-600' : 'border-gray-200'
						}`}>
							<div className="flex items-center justify-between mb-4">
								<h4 className={`font-medium flex items-center space-x-2 ${
									isDarkMode ? 'text-white' : 'text-gray-900'
								}`}>
									<Leaf className="h-4 w-4 text-green-600" />
									<span>Fertirriego - Registro Diario</span>
								</h4>
								<label className="flex items-center space-x-2">
									<input
										type="checkbox"
										checked={formData.fertigation.enabled}
										onChange={() => handleResourceToggle('fertigation')}
										className="rounded border-gray-300 text-green-600 focus:ring-green-500"
									/>
									<span className={`text-sm ${
										isDarkMode ? 'text-gray-300' : 'text-gray-700'
									}`}>
										Habilitar
									</span>
								</label>
							</div>
							
							{formData.fertigation.enabled && (
								<div className="space-y-4">
									{/* Botón para agregar registro */}
									<button
										type="button"
										onClick={addFertigationRecord}
										className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
											isDarkMode 
												? 'bg-green-600 hover:bg-green-700 text-white' 
												: 'bg-green-500 hover:bg-green-600 text-white'
										}`}
									>
										<Plus className="h-4 w-4" />
										<span>Agregar Registro Diario</span>
									</button>
									
									{/* Lista de registros */}
									{formData.fertigation.dailyRecords.length > 0 && (
										<div className="space-y-3">
											<h5 className={`text-sm font-medium ${
												isDarkMode ? 'text-gray-300' : 'text-gray-700'
											}`}>
												Registros ({formData.fertigation.dailyRecords.length})
											</h5>
											
											{formData.fertigation.dailyRecords.map((record, recordIndex) => (
												<div key={recordIndex} className={`p-4 rounded-lg border ${
													isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'
												}`}>
													<div className="flex items-center justify-between mb-3">
														<h6 className={`font-medium ${
															isDarkMode ? 'text-white' : 'text-gray-900'
														}`}>
															Registro {recordIndex + 1} - {record.date}
														</h6>
														<div className="flex items-center space-x-2">
															<button
																type="button"
																onClick={() => addFertilizerToRecord(recordIndex)}
																className="flex items-center space-x-1 px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors"
															>
																<Plus className="h-3 w-3" />
																<span>+ Fertilizante</span>
															</button>
															<button
																type="button"
																onClick={() => removeFertigationRecord(recordIndex)}
																className="text-red-500 hover:text-red-700"
															>
																<Trash2 className="h-4 w-4" />
															</button>
														</div>
													</div>
													
													{/* Fertilizantes */}
													<div className="mb-4">
														<h6 className={`block text-sm font-medium mb-2 ${
															isDarkMode ? 'text-gray-300' : 'text-gray-700'
														}`}>
															Fertilizantes ({record.fertilizers.length})
														</h6>
														
														{record.fertilizers.map((fertilizer, fertilizerIndex) => (
															<div key={fertilizerIndex} className={`p-3 rounded border mb-2 ${
																isDarkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-white'
															}`}>
																<div className="flex items-center justify-between mb-2">
																	<span className={`text-xs font-medium ${
																		isDarkMode ? 'text-gray-300' : 'text-gray-600'
																	}`}>
																		Fertilizante {fertilizerIndex + 1}
																	</span>
																	{record.fertilizers.length > 1 && (
																		<button
																			type="button"
																			onClick={() => removeFertilizer(recordIndex, fertilizerIndex)}
																			className="text-red-500 hover:text-red-700"
																		>
																			<Trash2 className="h-3 w-3" />
																		</button>
																	)}
																</div>
																
																<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
																	<div>
																		<label className={`block text-xs font-medium mb-1 ${
																			isDarkMode ? 'text-gray-400' : 'text-gray-600'
																		}`}>
																			Tipo
																		</label>
																		<select
																			value={fertilizer.productId || ''}
																			onChange={(e) => handleFertilizerTypeChange(recordIndex, fertilizerIndex, e.target.value)}
																			className={`w-full px-2 py-1 text-sm border rounded transition-colors ${
																				isDarkMode 
																					? 'bg-gray-600 border-gray-500 text-white' 
																					: 'bg-white border-gray-300 text-gray-900'
																			}`}
																		>
																			<option value="">Seleccionar fertilizante...</option>
																			{Array.isArray(availableFertilizers) && availableFertilizers.map((product) => (
																				<option key={product._id} value={product._id}>
																					{product.name} - {product.pricePerUnit}€/{product.unit}
																				</option>
																			))}
																		</select>
																	</div>
																	
																	<div className="flex space-x-1">
																		<div className="flex-1">
																			<label className={`block text-xs font-medium mb-1 ${
																				isDarkMode ? 'text-gray-400' : 'text-gray-600'
																			}`}>
																				Cantidad
																			</label>
																			<input
																				type="number"
																				step="0.01"
																				value={fertilizer.fertilizerAmount}
																				onChange={(e) => handleFertilizerAmountChange(recordIndex, fertilizerIndex, parseFloat(e.target.value) || 0)}
																				onFocus={handleNumberFocus}
																				className={`w-full px-2 py-1 text-sm border rounded transition-colors ${
																					isDarkMode 
																						? 'bg-gray-600 border-gray-500 text-white' 
																						: 'bg-white border-gray-300 text-gray-900'
																				}`}
																				placeholder="0.00"
																			/>
																		</div>
																		<div className="w-16">
																			<label className={`block text-xs font-medium mb-1 ${
																				isDarkMode ? 'text-gray-400' : 'text-gray-600'
																			}`}>
																				Unidad
																			</label>
																			<select
																				value={fertilizer.fertilizerUnit}
																				onChange={(e) => updateFertilizer(recordIndex, fertilizerIndex, 'fertilizerUnit', e.target.value)}
																				className={`w-full px-2 py-1 text-sm border rounded transition-colors ${
																					isDarkMode 
																						? 'bg-gray-600 border-gray-500 text-white' 
																						: 'bg-white border-gray-300 text-gray-900'
																				}`}
																			>
																				<option value="kg">kg</option>
																				<option value="g">g</option>
																				<option value="l">L</option>
																				<option value="ml">ml</option>
																			</select>
																		</div>
																	</div>
																	
																	<div>
																		<label className={`block text-xs font-medium mb-1 ${
																			isDarkMode ? 'text-gray-400' : 'text-gray-600'
																		}`}>
																			Coste (€)
																		</label>
																		<input
																			type="number"
																			step="0.01"
																			value={fertilizer.cost}
																			onChange={(e) => updateFertilizer(recordIndex, fertilizerIndex, 'cost', parseFloat(e.target.value) || 0)}
																			onFocus={handleNumberFocus}
																			className={`w-full px-2 py-1 text-sm border rounded transition-colors ${
																				isDarkMode 
																					? 'bg-gray-600 border-gray-500 text-white' 
																					: 'bg-white border-gray-300 text-gray-900'
																			}`}
																			placeholder="0.00"
																		/>
																	</div>
																	
																	{/* Información del proveedor */}
																	{fertilizer.supplier && (
																		<div className="col-span-2">
																			<div className="grid grid-cols-2 gap-2">
																				<div>
																					<label className={`block text-xs font-medium mb-1 ${
																						isDarkMode ? 'text-gray-400' : 'text-gray-600'
																					}`}>
																						Marca
																					</label>
																					<input
																						type="text"
																						value={fertilizer.brand || ''}
																						onChange={(e) => updateFertilizer(recordIndex, fertilizerIndex, 'brand', e.target.value)}
																						className={`w-full px-2 py-1 text-sm border rounded transition-colors ${
																							isDarkMode 
																								? 'bg-gray-600 border-gray-500 text-white' 
																								: 'bg-white border-gray-300 text-gray-900'
																						}`}
																						placeholder="Marca del producto"
																					/>
																				</div>
																				<div>
																					<label className={`block text-xs font-medium mb-1 ${
																						isDarkMode ? 'text-gray-400' : 'text-gray-600'
																					}`}>
																						Proveedor
																					</label>
																					<select
																						value={fertilizer.supplier || ''}
																						onChange={(e) => updateFertilizer(recordIndex, fertilizerIndex, 'supplier', e.target.value)}
																						className={`w-full px-2 py-1 text-sm border rounded transition-colors ${
																							isDarkMode 
																								? 'bg-gray-600 border-gray-500 text-white' 
																								: 'bg-white border-gray-300 text-gray-900'
																						}`}
																					>
																						<option value="">Seleccionar proveedor...</option>
																						{Array.isArray(availableSuppliers) && availableSuppliers.map((supplier) => (
																							<option key={supplier._id} value={supplier.name}>
																								{supplier.name}
																							</option>
																						))}
																					</select>
																				</div>
																			</div>
																			<div className="mt-2">
																				<label className={`block text-xs font-medium mb-1 ${
																					isDarkMode ? 'text-gray-400' : 'text-gray-600'
																				}`}>
																					Fecha de Compra
																				</label>
																				<input
																					type="date"
																					value={fertilizer.purchaseDate || ''}
																					onChange={(e) => updateFertilizer(recordIndex, fertilizerIndex, 'purchaseDate', e.target.value)}
																					className={`w-full px-2 py-1 text-sm border rounded transition-colors ${
																						isDarkMode 
																							? 'bg-gray-600 border-gray-500 text-white' 
																							: 'bg-white border-gray-300 text-gray-900'
																					}`}
																				/>
																			</div>
																		</div>
																	)}
																	
																	<div>
																		<label className={`block text-xs font-medium mb-1 ${
																			isDarkMode ? 'text-gray-400' : 'text-gray-600'
																		}`}>
																			Notas
																		</label>
																		<input
																			type="text"
																			value={fertilizer.notes || ''}
																			onChange={(e) => updateFertilizer(recordIndex, fertilizerIndex, 'notes', e.target.value)}
																			className={`w-full px-2 py-1 text-sm border rounded transition-colors ${
																				isDarkMode 
																					? 'bg-gray-600 border-gray-500 text-white' 
																					: 'bg-white border-gray-300 text-gray-900'
																			}`}
																			placeholder="Observaciones..."
																		/>
																	</div>
																</div>
															</div>
														))}
													</div>
													
													{/* Consumo de agua y coste total */}
													<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
														<div className="flex space-x-1">
															<div className="flex-1">
																<label className={`block text-xs font-medium mb-1 ${
																	isDarkMode ? 'text-gray-400' : 'text-gray-600'
																}`}>
																	Consumo Agua
																</label>
																<input
																	type="number"
																	step="0.01"
																	value={record.waterConsumption}
																	onChange={(e) => updateFertigationRecord(recordIndex, 'waterConsumption', parseFloat(e.target.value) || 0)}
																	onFocus={handleNumberFocus}
																	className={`w-full px-2 py-1 text-sm border rounded transition-colors ${
																		isDarkMode 
																			? 'bg-gray-600 border-gray-500 text-white' 
																			: 'bg-white border-gray-300 text-gray-900'
																	}`}
																	placeholder="0.00"
																/>
															</div>
															<div className="w-16">
																<label className={`block text-xs font-medium mb-1 ${
																	isDarkMode ? 'text-gray-400' : 'text-gray-600'
																}`}>
																	Unidad
																</label>
																<select
																	value={record.waterUnit}
																	onChange={(e) => updateFertigationRecord(recordIndex, 'waterUnit', e.target.value)}
																	className={`w-full px-2 py-1 text-sm border rounded transition-colors ${
																		isDarkMode 
																			? 'bg-gray-600 border-gray-500 text-white' 
																			: 'bg-white border-gray-300 text-gray-900'
																	}`}
																>
																	<option value="L">L</option>
																	<option value="m3">m³</option>
																	<option value="gal">gal</option>
																</select>
															</div>
														</div>
														
														<div>
															<label className={`block text-xs font-medium mb-1 ${
																isDarkMode ? 'text-gray-400' : 'text-gray-600'
															}`}>
																Coste Total (€)
															</label>
															<input
																type="number"
																step="0.01"
																value={record.totalCost}
																readOnly
																className={`w-full px-2 py-1 text-sm border rounded transition-colors ${
																	isDarkMode 
																		? 'bg-gray-600 border-gray-500 text-white' 
																		: 'bg-white border-gray-300 text-gray-900'
																}`}
																placeholder="0.00"
															/>
														</div>
														
														<div>
															<label className={`block text-xs font-medium mb-1 ${
																isDarkMode ? 'text-gray-400' : 'text-gray-600'
															}`}>
																Notas del Día
															</label>
															<input
																type="text"
																value={record.notes || ''}
																onChange={(e) => updateFertigationRecord(recordIndex, 'notes', e.target.value)}
																className={`w-full px-2 py-1 text-sm border rounded transition-colors ${
																	isDarkMode 
																		? 'bg-gray-600 border-gray-500 text-white' 
																		: 'bg-white border-gray-300 text-gray-900'
																}`}
																placeholder="Observaciones del día..."
															/>
														</div>
													</div>
												</div>
											))}
										</div>
									)}
									
									{/* Notas generales de fertirriego */}
									<div>
										<label className={`block text-sm font-medium mb-2 ${
											isDarkMode ? 'text-gray-300' : 'text-gray-700'
										}`}>
											Notas Generales
										</label>
										<textarea
											value={formData.fertigation.notes}
											onChange={(e) => handleResourceChange('fertigation', 'notes', e.target.value)}
											rows={2}
											className={`w-full px-3 py-2 border rounded-lg transition-colors ${
												isDarkMode 
													? 'bg-gray-700 border-gray-600 text-white' 
													: 'bg-white border-gray-300 text-gray-900'
											}`}
											placeholder="Observaciones generales sobre fertirriego..."
										/>
									</div>
								</div>
							)}
						</div>
                        						{/* Tratamientos Fitosanitarios */}
						<div className={`border rounded-lg p-4 ${
							isDarkMode ? 'border-gray-600' : 'border-gray-200'
						}`}>
							<div className="flex items-center justify-between mb-4">
								<h4 className={`font-medium flex items-center space-x-2 ${
									isDarkMode ? 'text-white' : 'text-gray-900'
								}`}>
									<Shield className="h-4 w-4 text-orange-600" />
									<span>Tratamientos Fitosanitarios</span>
								</h4>
								<label className="flex items-center space-x-2">
									<input
										type="checkbox"
										checked={formData.phytosanitary.enabled}
										onChange={() => handleResourceToggle('phytosanitary')}
										className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
									/>
									<span className={`text-sm ${
										isDarkMode ? 'text-gray-300' : 'text-gray-700'
									}`}>
										Habilitar
									</span>
								</label>
							</div>
							
							{formData.phytosanitary.enabled && (
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<label className={`block text-sm font-medium mb-2 ${
											isDarkMode ? 'text-gray-300' : 'text-gray-700'
										}`}>
											Tipo de Tratamiento
										</label>
										<input
											type="text"
											value={formData.phytosanitary.treatmentType}
											onChange={(e) => handleResourceChange('phytosanitary', 'treatmentType', e.target.value)}
											className={`w-full px-3 py-2 border rounded-lg transition-colors ${
												isDarkMode 
													? 'bg-gray-700 border-gray-600 text-white' 
													: 'bg-white border-gray-300 text-gray-900'
											}`}
											placeholder="Ej: Fungicida, Insecticida"
										/>
									</div>
									
									<div>
										<label className={`block text-sm font-medium mb-2 ${
											isDarkMode ? 'text-gray-300' : 'text-gray-700'
										}`}>
											Producto
										</label>
										<input
											type="text"
											value={formData.phytosanitary.productName}
											onChange={(e) => handleResourceChange('phytosanitary', 'productName', e.target.value)}
											className={`w-full px-3 py-2 border rounded-lg transition-colors ${
												isDarkMode 
													? 'bg-gray-700 border-gray-600 text-white' 
													: 'bg-white border-gray-300 text-gray-900'
											}`}
											placeholder="Ej: Azufre, Cobre"
										/>
									</div>
									
									<div>
										<label className={`block text-sm font-medium mb-2 ${
											isDarkMode ? 'text-gray-300' : 'text-gray-700'
										}`}>
											Fecha de Aplicación
										</label>
										<input
											type="date"
											value={formData.phytosanitary.applicationDate}
											onChange={(e) => handleResourceChange('phytosanitary', 'applicationDate', e.target.value)}
											className={`w-full px-3 py-2 border rounded-lg transition-colors ${
												isDarkMode 
													? 'bg-gray-700 border-gray-600 text-white' 
													: 'bg-white border-gray-300 text-gray-900'
											}`}
										/>
									</div>
									
									<div>
										<label className={`block text-sm font-medium mb-2 ${
											isDarkMode ? 'text-gray-300' : 'text-gray-700'
										}`}>
											Dosis
										</label>
										<input
											type="text"
											value={formData.phytosanitary.dosage}
											onChange={(e) => handleResourceChange('phytosanitary', 'dosage', e.target.value)}
											className={`w-full px-3 py-2 border rounded-lg transition-colors ${
												isDarkMode 
													? 'bg-gray-700 border-gray-600 text-white' 
													: 'bg-white border-gray-300 text-gray-900'
											}`}
											placeholder="Ej: 2L/ha"
										/>
									</div>
									
									<div className="md:col-span-2">
										<label className={`block text-sm font-medium mb-2 ${
											isDarkMode ? 'text-gray-300' : 'text-gray-700'
										}`}>
											Notas
										</label>
										<textarea
											value={formData.phytosanitary.notes}
											onChange={(e) => handleResourceChange('phytosanitary', 'notes', e.target.value)}
											rows={2}
											className={`w-full px-3 py-2 border rounded-lg transition-colors ${
												isDarkMode 
													? 'bg-gray-700 border-gray-600 text-white' 
													: 'bg-white border-gray-300 text-gray-900'
											}`}
											placeholder="Observaciones sobre tratamientos..."
										/>
									</div>
								</div>
							)}
						</div>
						
						{/* Agua */}
						<div className={`border rounded-lg p-4 ${
							isDarkMode ? 'border-gray-600' : 'border-gray-200'
						}`}>
							<div className="flex items-center justify-between mb-4">
								<h4 className={`font-medium flex items-center space-x-2 ${
									isDarkMode ? 'text-white' : 'text-gray-900'
								}`}>
									<Droplets className="h-4 w-4 text-blue-600" />
									<span>Gestión del Agua</span>
								</h4>
								<label className="flex items-center space-x-2">
									<input
										type="checkbox"
										checked={formData.water.enabled}
										onChange={() => handleResourceToggle('water')}
										className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
									/>
									<span className={`text-sm ${
										isDarkMode ? 'text-gray-300' : 'text-gray-700'
									}`}>
										Habilitar
									</span>
								</label>
							</div>
							
							{formData.water.enabled && (
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<label className={`block text-sm font-medium mb-2 ${
											isDarkMode ? 'text-gray-300' : 'text-gray-700'
										}`}>
											Fuente de Agua
										</label>
										<input
											type="text"
											value={formData.water.waterSource}
											onChange={(e) => handleResourceChange('water', 'waterSource', e.target.value)}
											className={`w-full px-3 py-2 border rounded-lg transition-colors ${
												isDarkMode 
													? 'bg-gray-700 border-gray-600 text-white' 
													: 'bg-white border-gray-300 text-gray-900'
											}`}
											placeholder="Ej: Pozo, Río, Red municipal"
										/>
									</div>
									
									<div>
										<label className={`block text-sm font-medium mb-2 ${
											isDarkMode ? 'text-gray-300' : 'text-gray-700'
										}`}>
											Tipo de Riego
										</label>
										<input
											type="text"
											value={formData.water.irrigationType}
											onChange={(e) => handleResourceChange('water', 'irrigationType', e.target.value)}
											className={`w-full px-3 py-2 border rounded-lg transition-colors ${
												isDarkMode 
													? 'bg-gray-700 border-gray-600 text-white' 
													: 'bg-white border-gray-300 text-gray-900'
											}`}
											placeholder="Ej: Goteo, Aspersión, Manguera"
										/>
									</div>
									
									<div className="flex space-x-2">
										<div className="flex-1">
											<label className={`block text-sm font-medium mb-2 ${
												isDarkMode ? 'text-gray-300' : 'text-gray-700'
											}`}>
												Consumo Diario
											</label>
											<input
												type="number"
												step="0.01"
												value={formData.water.dailyConsumption}
												onChange={(e) => handleResourceChange('water', 'dailyConsumption', parseFloat(e.target.value) || 0)}
												className={`w-full px-3 py-2 border rounded-lg transition-colors ${
													isDarkMode 
														? 'bg-gray-700 border-gray-600 text-white' 
														: 'bg-white border-gray-300 text-gray-900'
												}`}
												placeholder="0.00"
											/>
										</div>
										<div className="w-20">
											<label className={`block text-sm font-medium mb-2 ${
												isDarkMode ? 'text-gray-300' : 'text-gray-700'
											}`}>
												Unidad
											</label>
											<select
												value={formData.water.waterUnit}
												onChange={(e) => handleResourceChange('water', 'waterUnit', e.target.value)}
												className={`w-full px-3 py-2 border rounded-lg transition-colors ${
													isDarkMode 
														? 'bg-gray-700 border-gray-600 text-white' 
														: 'bg-white border-gray-300 text-gray-900'
												}`}
											>
												<option value="L">L</option>
												<option value="m3">m³</option>
												<option value="gal">gal</option>
											</select>
										</div>
									</div>
									
									<div>
										<label className={`block text-sm font-medium mb-2 ${
											isDarkMode ? 'text-gray-300' : 'text-gray-700'
										}`}>
											Coste Diario (€)
										</label>
										<input
											type="number"
											step="0.01"
											value={formData.water.cost}
											onChange={(e) => handleResourceChange('water', 'cost', parseFloat(e.target.value) || 0)}
											className={`w-full px-3 py-2 border rounded-lg transition-colors ${
												isDarkMode 
													? 'bg-gray-700 border-gray-600 text-white' 
													: 'bg-white border-gray-300 text-gray-900'
											}`}
											placeholder="0.00"
										/>
									</div>
									
									<div className="md:col-span-2">
										<label className={`block text-sm font-medium mb-2 ${
											isDarkMode ? 'text-gray-300' : 'text-gray-700'
										}`}>
											Notas
										</label>
										<textarea
											value={formData.water.notes}
											onChange={(e) => handleResourceChange('water', 'notes', e.target.value)}
											rows={2}
											className={`w-full px-3 py-2 border rounded-lg transition-colors ${
												isDarkMode 
													? 'bg-gray-700 border-gray-600 text-white' 
													: 'bg-white border-gray-300 text-gray-900'
											}`}
											placeholder="Observaciones sobre gestión del agua..."
										/>
									</div>
								</div>
							)}
						</div>
						
						{/* Energía */}
						<div className={`border rounded-lg p-4 ${
							isDarkMode ? 'border-gray-600' : 'border-gray-200'
						}`}>
							<div className="flex items-center justify-between mb-4">
								<h4 className={`font-medium flex items-center space-x-2 ${
									isDarkMode ? 'text-white' : 'text-gray-900'
								}`}>
									<Zap className="h-4 w-4 text-yellow-600" />
									<span>Gestión de Energía</span>
								</h4>
								<label className="flex items-center space-x-2">
									<input
										type="checkbox"
										checked={formData.energy.enabled}
										onChange={() => handleResourceToggle('energy')}
										className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
									/>
									<span className={`text-sm ${
										isDarkMode ? 'text-gray-300' : 'text-gray-700'
									}`}>
										Habilitar
									</span>
								</label>
							</div>
							
							{formData.energy.enabled && (
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<label className={`block text-sm font-medium mb-2 ${
											isDarkMode ? 'text-gray-300' : 'text-gray-700'
										}`}>
											Tipo de Energía
										</label>
										<input
											type="text"
											value={formData.energy.energyType}
											onChange={(e) => handleResourceChange('energy', 'energyType', e.target.value)}
											className={`w-full px-3 py-2 border rounded-lg transition-colors ${
												isDarkMode 
													? 'bg-gray-700 border-gray-600 text-white' 
													: 'bg-white border-gray-300 text-gray-900'
											}`}
											placeholder="Ej: Eléctrica, Solar, Combustible"
										/>
									</div>
									
									<div className="flex space-x-2">
										<div className="flex-1">
											<label className={`block text-sm font-medium mb-2 ${
												isDarkMode ? 'text-gray-300' : 'text-gray-700'
											}`}>
												Consumo Diario
											</label>
											<input
												type="number"
												step="0.01"
												value={formData.energy.dailyConsumption}
												onChange={(e) => handleResourceChange('energy', 'dailyConsumption', parseFloat(e.target.value) || 0)}
												className={`w-full px-3 py-2 border rounded-lg transition-colors ${
													isDarkMode 
														? 'bg-gray-700 border-gray-600 text-white' 
														: 'bg-white border-gray-300 text-gray-900'
												}`}
												placeholder="0.00"
											/>
										</div>
										<div className="w-20">
											<label className={`block text-sm font-medium mb-2 ${
												isDarkMode ? 'text-gray-300' : 'text-gray-700'
											}`}>
												Unidad
											</label>
											<select
												value={formData.energy.energyUnit}
												onChange={(e) => handleResourceChange('energy', 'energyUnit', e.target.value)}
												className={`w-full px-3 py-2 border rounded-lg transition-colors ${
													isDarkMode 
														? 'bg-gray-700 border-gray-600 text-white' 
														: 'bg-white border-gray-300 text-gray-900'
												}`}
											>
												<option value="kWh">kWh</option>
												<option value="Wh">Wh</option>
												<option value="MJ">MJ</option>
												<option value="L">L</option>
											</select>
										</div>
									</div>
									
									<div>
										<label className={`block text-sm font-medium mb-2 ${
											isDarkMode ? 'text-gray-300' : 'text-gray-700'
										}`}>
											Coste Diario (€)
										</label>
										<input
											type="number"
											step="0.01"
											value={formData.energy.cost}
											onChange={(e) => handleResourceChange('energy', 'cost', parseFloat(e.target.value) || 0)}
											className={`w-full px-3 py-2 border rounded-lg transition-colors ${
												isDarkMode 
													? 'bg-gray-700 border-gray-600 text-white' 
													: 'bg-white border-gray-300 text-gray-900'
											}`}
											placeholder="0.00"
										/>
									</div>
									
									<div className="md:col-span-2">
										<label className={`block text-sm font-medium mb-2 ${
											isDarkMode ? 'text-gray-300' : 'text-gray-700'
										}`}>
											Notas
										</label>
										<textarea
											value={formData.energy.notes}
											onChange={(e) => handleResourceChange('energy', 'notes', e.target.value)}
											rows={2}
											className={`w-full px-3 py-2 border rounded-lg transition-colors ${
												isDarkMode 
													? 'bg-gray-700 border-gray-600 text-white' 
													: 'bg-white border-gray-300 text-gray-900'
											}`}
											placeholder="Observaciones sobre gestión de energía..."
										/>
									</div>
								</div>
							)}
						</div>
					</div>
                    					{/* Información Adicional */}
					<div className={`border rounded-lg p-4 ${
						isDarkMode ? 'border-gray-600' : 'border-gray-200'
					}`}>
						<h4 className={`font-medium flex items-center space-x-2 mb-4 ${
							isDarkMode ? 'text-white' : 'text-gray-900'
						}`}>
							<Info className="h-4 w-4 text-gray-600" />
							<span>Información Adicional</span>
						</h4>
						
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label className={`block text-sm font-medium mb-2 ${
									isDarkMode ? 'text-gray-300' : 'text-gray-700'
								}`}>
									Estado del Cultivo
								</label>
								<select
									value={formData.status}
									onChange={(e) => setFormData({ ...formData, status: e.target.value as ActivityStatus })}
									className={`w-full px-3 py-2 border rounded-lg transition-colors ${
										isDarkMode 
											? 'bg-gray-700 border-gray-600 text-white' 
											: 'bg-white border-gray-300 text-gray-900'
									}`}
								>
									<option value="planning">En Planificación</option>
									<option value="active">Activo</option>
									<option value="completed">Completado</option>
									<option value="paused">Pausado</option>
									<option value="cancelled">Cancelado</option>
								</select>
							</div>
							
							<div>
								<label className={`block text-sm font-medium mb-2 ${
									isDarkMode ? 'text-gray-300' : 'text-gray-700'
								}`}>
									Prioridad
								</label>
								<select
									value={formData.priority}
									onChange={(e) => setFormData({ ...formData, priority: e.target.value as ActivityPriority })}
									className={`w-full px-3 py-2 border rounded-lg transition-colors ${
										isDarkMode 
											? 'bg-gray-700 border-gray-600 text-white' 
											: 'bg-white border-gray-300 text-gray-900'
									}`}
								>
									<option value="low">Baja</option>
									<option value="medium">Media</option>
									<option value="high">Alta</option>
									<option value="urgent">Urgente</option>
								</select>
							</div>
							
							<div className="md:col-span-2">
								<label className={`block text-sm font-medium mb-2 ${
									isDarkMode ? 'text-gray-300' : 'text-gray-700'
								}`}>
									Observaciones Generales
								</label>
								<textarea
									value={formData.notes}
									onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
									rows={3}
									className={`w-full px-3 py-2 border rounded-lg transition-colors ${
										isDarkMode 
											? 'bg-gray-700 border-gray-600 text-white' 
											: 'bg-white border-gray-300 text-gray-900'
									}`}
									placeholder="Observaciones generales sobre la actividad..."
								/>
							</div>
						</div>
					</div>
				</div>
				
				{/* Botones de acción */}
				<div className={`flex justify-end space-x-3 pt-6 border-t ${
					isDarkMode ? 'border-gray-600' : 'border-gray-200'
				}`}>
					<button
						type="button"
						onClick={onClose}
						className={`px-4 py-2 rounded-lg font-medium transition-colors ${
							isDarkMode 
								? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
								: 'bg-gray-200 text-gray-700 hover:bg-gray-300'
						}`}
					>
						Cancelar
					</button>
					<button
						type="submit"
						disabled={isSubmitting}
						className={`px-6 py-2 rounded-lg font-medium transition-colors ${
							isSubmitting
								? 'bg-gray-400 cursor-not-allowed'
								: 'bg-green-600 text-white hover:bg-green-700'
						}`}
					>
						{isSubmitting ? (
							<div className="flex items-center space-x-2">
								<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
								<span>Guardando...</span>
							</div>
						) : (
							'Guardar Actividad'
						)}
					</button>
				</div>
			</form>
		</div>
	</div>
)
}

export default ActivityFormModal