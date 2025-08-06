import React, { useState, useEffect } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import type { DailyFertigationRecord, FertilizerRecord, ProductPrice } from '../types'
import { productAPI, inventoryAPI } from '../services/api'

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

	useEffect(() => {
		if (isOpen) {
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

	const loadData = async () => {
		try {
			const [fertilizers, phytosanitaries] = await Promise.all([
				productAPI.getByType('fertilizer'),
				productAPI.getByType('phytosanitary')
			])
			
			// Combinar fertilizantes y fitosanitarios
			const allProducts = [
				...(Array.isArray(fertilizers) ? fertilizers : []),
				...(Array.isArray(phytosanitaries) ? phytosanitaries : [])
			]
			
			setAvailableFertilizers(allProducts)
		} catch (error) {
			console.error('Error loading data:', error)
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
		setFormData(prev => ({
			...prev,
			fertilizers: prev.fertilizers.map((fertilizer, i) => 
				i === index ? { ...fertilizer, [field]: value } : fertilizer
			)
		}))
	}

	const removeFertilizer = (index: number) => {
		setFormData(prev => ({
			...prev,
			fertilizers: prev.fertilizers.filter((_, i) => i !== index)
		}))
	}

	const handleFertilizerTypeChange = async (index: number, productId: string) => {
		if (!productId) return

		try {
			const product = availableFertilizers.find(p => p._id === productId)
			if (product) {
				// Buscar información del inventario
				const inventoryItem = await inventoryAPI.getByProduct(productId)
				
				updateFertilizer(index, 'productId', productId)
				updateFertilizer(index, 'fertilizerType', product.name)
				updateFertilizer(index, 'price', product.pricePerUnit)
				updateFertilizer(index, 'brand', product.brand || '')
				updateFertilizer(index, 'supplier', product.supplier || '')
				updateFertilizer(index, 'purchaseDate', product.purchaseDate || '')
				
				// Mostrar stock disponible si existe
				if (inventoryItem) {
					console.log(`Stock disponible: ${inventoryItem.currentStock} ${inventoryItem.unit}`)
				}
			}
		} catch (error) {
			console.error('Error loading product details:', error)
		}
	}

	const calculateTotalCost = () => {
		const fertilizersCost = formData.fertilizers.reduce((sum, f) => sum + f.cost, 0)
		const waterCost = formData.waterConsumption * 0.001 // Costo estimado por litro
		return fertilizersCost + waterCost
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
			
			if (formData.fertilizers.length === 0) {
				newErrors.fertilizers = 'Debe añadir al menos un fertilizante'
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
				}))
			}

			await onSubmit(updatedFormData)
			onClose()
		} catch (error) {
			console.error('Error submitting fertigation day:', error)
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleNumberFocus = (e: React.FocusEvent<HTMLInputElement>) => {
		if (e.target.value === '0') {
			e.target.value = ''
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
									Productos (Fertilizantes y Fitosanitarios)
								</label>
								<button
									type="button"
									onClick={addFertilizer}
									className="flex items-center space-x-2 px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
								>
									<Plus className="h-4 w-4" />
									<span>Añadir Producto</span>
								</button>
							</div>

							{formData.fertilizers.length === 0 ? (
								<p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
									No hay productos añadidos
								</p>
							) : (
								<div className="space-y-4">
									{formData.fertilizers.map((fertilizer, index) => (
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
														Tipo de Producto
													</label>
													<select
														value={fertilizer.productId}
														onChange={(e) => handleFertilizerTypeChange(index, e.target.value)}
														className={`w-full px-3 py-2 border rounded-lg transition-colors ${
															isDarkMode 
																? 'bg-gray-700 border-gray-600 text-white' 
																: 'bg-white border-gray-300 text-gray-900'
														}`}
													>
														<option value="">Seleccionar producto</option>
														{availableFertilizers.map(product => (
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
															onChange={(e) => updateFertilizer(index, 'fertilizerAmount', parseFloat(e.target.value) || 0)}
															onFocus={handleNumberFocus}
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
															</span> {fertilizer.brand}
														</div>
														<div>
															<span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
																Proveedor:
															</span> {fertilizer.supplier}
														</div>
														<div>
															<span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
																Precio:
															</span> {(fertilizer.price || 0)}€/{fertilizer.unit || 'kg'}
														</div>
													</div>
													<div className="mt-2">
														<span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
															Coste:
														</span> {(fertilizer.fertilizerAmount * (fertilizer.price || 0)).toFixed(2)}€
													</div>
												</div>
											)}

											{errors[`fertilizer_${index}`] && (
												<p className="text-red-500 text-sm mt-2">{errors[`fertilizer_${index}`]}</p>
											)}
										</div>
									))}
								</div>
							)}

							{errors.fertilizers && (
								<p className="text-red-500 text-sm mt-2">{errors.fertilizers}</p>
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
							<div className="flex justify-between items-center">
								<span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
									Coste Total del Día:
								</span>
								<span className="text-lg font-bold text-green-600">
									{calculateTotalCost().toFixed(2)}€
								</span>
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
		</div>
	)
}

export default FertigationDayModal 