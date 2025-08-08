import React, { useState, useEffect } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import type { DailyFertigationRecord, FertilizerRecord, ProductPrice, OtherExpenseRecord } from '../types'
import { productAPI, inventoryAPI, purchaseAPI } from '../services/api'
import CostBreakdownModal from './CostBreakdownModal'
import OtherExpensesModal from './OtherExpensesModal'

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
	const [formData, setFormData] = useState<DailyFertigationRecord>({
		date: '',
		fertilizers: [],
		waterConsumption: 0,
		waterUnit: 'L',
		notes: '',
		totalCost: 0
	})

	const [availableFertilizers, setAvailableFertilizers] = useState<ProductPrice[]>([])
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [errors, setErrors] = useState<{ [key: string]: string }>({})
	const [showCostBreakdown, setShowCostBreakdown] = useState(false)
	const [costBreakdownData, setCostBreakdownData] = useState<any>(null)
	const [showOtherExpensesModal, setShowOtherExpensesModal] = useState(false)
	const [otherExpenses, setOtherExpenses] = useState<OtherExpenseRecord[]>([])

	useEffect(() => {
		if (isOpen) {
			console.log('🔄 Modal abierto, cargando datos...')
			loadData()
			if (existingDay) {
				setFormData(existingDay)
			} else {
				// Fecha por defecto: hoy
				setFormData({
					date: new Date().toISOString().split('T')[0],
					fertilizers: [],
					waterConsumption: 0,
					waterUnit: 'L',
					notes: '',
					totalCost: 0
				})
			}
		}
	}, [isOpen, existingDay])

	// Recalcular coste total cuando cambien los datos
	useEffect(() => {
		if (isOpen) {
			const newTotalCost = calculateTotalCost()
			setFormData(prev => ({
				...prev,
				totalCost: newTotalCost
			}))
		}
	}, [formData.fertilizers, formData.waterConsumption])

	const loadData = async () => {
		try {
			console.log('🔄 Cargando fertilizantes y agua...')
			
			const [fertilizersResponse, waterResponse] = await Promise.all([
				productAPI.getByType('fertilizer'),
				productAPI.getByType('water')
			])
			
			console.log('📦 Respuesta fertilizantes:', fertilizersResponse)
			console.log('💧 Respuesta agua:', waterResponse)
			
			// Combinar fertilizantes y agua
			const fertilizers = fertilizersResponse?.products || fertilizersResponse || []
			const waterProducts = waterResponse?.products || waterResponse || []
			const allProducts = [...fertilizers, ...waterProducts]
			
			console.log('📦 Productos extraídos:', allProducts)
			
			setAvailableFertilizers(Array.isArray(allProducts) ? allProducts : [])
		} catch (error) {
			console.error('❌ Error loading products:', error)
			setAvailableFertilizers([])
		}
	}

	const handleInputChange = (field: keyof DailyFertigationRecord, value: any) => {
		setFormData(prev => ({ ...prev, [field]: value }))
		if (errors[field]) {
			setErrors(prev => ({ ...prev, [field]: '' }))
		}
	}

	const addFertilizer = () => {
		const newFertilizer: FertilizerRecord = {
			productId: '',
			fertilizerType: '',
			fertilizerAmount: 0,
			fertilizerUnit: 'kg',
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
		setFormData(prev => ({
			...prev,
			fertilizers: prev.fertilizers.filter((_, i) => i !== index)
		}))
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
			const product = availableFertilizers.find(p => p._id === productId)
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

			// Actualizar en un solo setState para evitar inconsistencias visuales
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
				return { ...prev, fertilizers: newFertilizers }
			})

			// Info inventario opcional
			try {
				const inventoryItem = await inventoryAPI.getByProduct(productId)
				if (inventoryItem) {
					console.log(`Stock disponible: ${inventoryItem.currentStock} ${inventoryItem.unit}`)
				}
			} catch (inventoryError) {
				console.log('No se encontró inventario para este producto (normal si no está registrado):', (inventoryError as Error).message)
			}
		} catch (error) {
			console.error('Error loading product details:', error)
		}
	}

    const calculateTotalCost = () => {
        // Calcular coste de fertilizantes con precio de producto seleccionado como fuente de verdad
        const fertilizersCost = formData.fertilizers.reduce((sum, f) => {
            const product = availableFertilizers.find(p => p._id === f.productId)
            const unitPrice = (product?.pricePerUnit != null ? Number(product.pricePerUnit) : undefined) ?? (f.price || 0)
            const cost = f.fertilizerAmount * (unitPrice || 0)
            console.log(`Fertilizante ${f.fertilizerType}: ${f.fertilizerAmount} × ${unitPrice}€ = ${cost}€`)
            return sum + cost
        }, 0)
		
		// Calcular coste del agua usando el precio real del agua
		// Buscar el precio del agua en los productos disponibles
		const waterProduct = availableFertilizers.find(p => p.type === 'water')
		const waterPrice = waterProduct?.pricePerUnit || 0
		const waterCost = formData.waterConsumption * waterPrice
		
		console.log(`Agua: ${formData.waterConsumption} × ${waterPrice}€ = ${waterCost}€`)
		
		// Calcular coste de otros gastos
		const otherExpensesCost = otherExpenses.reduce((sum, expense) => {
			const cost = expense.expenseAmount * (expense.price || 0)
			console.log(`Otro gasto ${expense.expenseType}: ${expense.expenseAmount} × ${expense.price}€ = ${cost}€`)
			return sum + cost
		}, 0)
		
        const totalCost = fertilizersCost + waterCost + otherExpensesCost
		console.log(`Coste total: ${fertilizersCost}€ (fertilizantes) + ${waterCost}€ (agua) + ${otherExpensesCost}€ (otros) = ${totalCost}€`)
		
		return totalCost
	}

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

			// Llamar a la función onSubmit que ahora conectará con el backend
			await onSubmit(updatedFormData)
			
			// Preparar datos para el desglose de costes
			const waterProduct = availableFertilizers.find(p => p.type === 'water')
			const waterPrice = waterProduct?.pricePerUnit || 0
			
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
					consumption: formData.waterConsumption,
					unit: formData.waterUnit,
					price: waterPrice,
					cost: formData.waterConsumption * waterPrice
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
			
			onClose()
		} catch (error) {
			console.error('Error submitting fertigation day:', error)
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
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl shadow-xl transition-colors ${
				isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
			}`}>
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
					<h2 className="text-xl font-bold">
						{existingDay ? 'Editar Día de Fertirriego' : 'Añadir Día de Fertirriego'}
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

				{/* Content */}
				<div className="p-6">
					<div className="mb-4">
						<p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
							Actividad: <span className="font-medium">{activityName}</span>
						</p>
					</div>

					<form onSubmit={handleSubmit} className="space-y-6">
						{/* Fecha */}
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

						{/* Fertilizantes */}
						<div>
							<div className="flex items-center justify-between mb-4">
								<label className={`text-sm font-medium ${
									isDarkMode ? 'text-gray-300' : 'text-gray-700'
								}`}>
									Productos (Fertilizantes)
								</label>
								<button
									type="button"
									onClick={addFertilizer}
									className="flex items-center space-x-2 px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
								>
									<Plus className="h-4 w-4" />
									<span>Añadir Fertilizante</span>
								</button>
							</div>

							{formData.fertilizers.length === 0 ? (
								<div className={`p-4 border-2 border-dashed rounded-lg text-center ${
									isDarkMode ? 'border-gray-600 text-gray-400' : 'border-gray-300 text-gray-500'
								}`}>
									<p className="text-sm mb-2">No hay productos añadidos</p>
									<p className="text-xs">
										{availableFertilizers.length === 0 
											? 'No hay fertilizantes registrados. Ve a "Gestión > Productos y Precios" para añadir fertilizantes.'
											: 'Haz clic en "Añadir Fertilizante" para comenzar'
										}
									</p>
								</div>
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
												<button
													type="button"
													onClick={() => removeFertilizer(index)}
													className="text-red-500 hover:text-red-700 transition-colors"
												>
													<Trash2 className="h-4 w-4" />
												</button>
											</div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
												<div>
													<label className={`block text-sm font-medium mb-2 ${
														isDarkMode ? 'text-gray-300' : 'text-gray-700'
													}`}>
														Tipo de Fertilizante
													</label>
													<select
														value={fertilizer.productId}
														onChange={(e) => {
															console.log('🎯 Select onChange - Valor seleccionado:', e.target.value)
															handleFertilizerTypeChange(index, e.target.value)
														}}
														onFocus={() => console.log('🎯 Select focus - Valor actual:', fertilizer.productId)}
														className={`w-full px-3 py-2 border rounded-lg transition-colors ${
															isDarkMode 
																? 'bg-gray-700 border-gray-600 text-white' 
																: 'bg-white border-gray-300 text-gray-900'
														}`}
													>
														<option value="">
															{availableFertilizers.length === 0 
																? 'No hay fertilizantes disponibles' 
																: 'Seleccionar fertilizante'
															}
														</option>
														{availableFertilizers
															.filter(product => product.type === 'fertilizer')
															.map(product => (
															<option key={product._id} value={product._id}>
																{product.name} - {product.pricePerUnit}€/{product.unit}
															</option>
														))}
													</select>
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
                                                            const value = parseFloat(e.target.value) || 0
                                                            // actualiza cantidad y recalcula coste con precio del producto
                                                            const product = availableFertilizers.find(p => p._id === fertilizer.productId)
                                                            const unitPrice = (product?.pricePerUnit != null ? Number(product.pricePerUnit) : undefined) ?? (fertilizer.price || 0)
                                                            updateFertilizer(index, 'fertilizerAmount', value)
                                                            updateFertilizer(index, 'price', unitPrice)
                                                        }}
															onFocus={handleNumberFocus}
															onBlur={handleNumberBlur}
															className={`flex-1 px-3 py-2 border rounded-lg transition-colors ${
																isDarkMode 
																	? 'bg-gray-700 border-gray-600 text-white' 
																	: 'bg-white border-gray-300 text-gray-900'
															}`}
														/>
														<select
															value={fertilizer.unit || 'kg'}
															onChange={(e) => updateFertilizer(index, 'unit', e.target.value)}
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
                                                            </span> {(availableFertilizers.find(p => p._id === fertilizer.productId)?.pricePerUnit ?? fertilizer.price ?? 0)}€/{availableFertilizers.find(p => p._id === fertilizer.productId)?.unit ?? fertilizer.unit ?? 'kg'}
														</div>
													</div>
													<div className="mt-2">
														<span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
															Coste:
                                                        </span> {(fertilizer.fertilizerAmount * ((availableFertilizers.find(p => p._id === fertilizer.productId)?.pricePerUnit ?? fertilizer.price ?? 0))).toFixed(2)}€
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
									onChange={(e) => handleInputChange('waterConsumption', parseFloat(e.target.value) || 0)}
									onFocus={handleNumberFocus}
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
									<option value="L">L</option>
									<option value="m3">m³</option>
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
													{(expense.expenseAmount * (expense.price || 0)).toFixed(2)}€
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
                                        {formData.fertilizers.reduce((s, f) => s + f.fertilizerAmount * ((availableFertilizers.find(p => p._id === f.productId)?.pricePerUnit ?? f.price ?? 0)), 0).toFixed(2)}€
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Subtotal agua</span>
                                    <span className="font-semibold">
                                        {(formData.waterConsumption * (availableFertilizers.find(p => p.type === 'water')?.pricePerUnit || 0)).toFixed(2)}€
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Subtotal otros</span>
                                    <span className="font-semibold">
                                        {otherExpenses.reduce((s, e) => s + e.expenseAmount * (e.price || 0), 0).toFixed(2)}€
                                    </span>
                                </div>
                                <div className="h-px bg-gray-300 dark:bg-gray-600" />
                                <div className="flex justify-between items-center">
                                    <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Coste Total del Día:</span>
                                    <span className="text-lg font-bold text-green-600">{calculateTotalCost().toFixed(2)}€</span>
                                </div>
                            </div>
						</div>

						{/* Actions */}
						<div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
							<button
								type="button"
								onClick={onClose}
								className={`px-4 py-2 border rounded-lg transition-colors ${
									isDarkMode 
										? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
										: 'border-gray-300 text-gray-700 hover:bg-gray-50'
								}`}
							>
								Cancelar
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
		</div>
	)
}

export default FertigationDayModal 