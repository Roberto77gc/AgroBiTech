import React, { useState, useEffect } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import type { ProductPrice, DailyPhytosanitaryRecord as DailyPhytoTypesRecord } from '../types'
import { productAPI } from '../services/api'

interface PhytosanitaryRecord {
	productId: string
	phytosanitaryType: string
	phytosanitaryAmount: number
	phytosanitaryUnit: string
	price?: number
	unit?: string
	brand: string
	supplier: string
	purchaseDate: string
	cost: number
}

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

	useEffect(() => {
		if (isOpen) {
			loadData()
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
		}
	}, [isOpen, existingDay])

	const loadData = async () => {
		try {
			const phytosanitariesResponse = await productAPI.getByType('phytosanitary')
			const phytosanitaries = phytosanitariesResponse?.products || phytosanitariesResponse || []
			setAvailablePhytosanitaries(Array.isArray(phytosanitaries) ? phytosanitaries : [])
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
			phytosanitaryUnit: 'L',
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

	const removePhytosanitary = (index: number) => {
		setFormData(prev => ({
			...prev,
			phytosanitaries: prev.phytosanitaries.filter((_, i) => i !== index)
		}))
	}

	const handlePhytosanitaryTypeChange = async (index: number, productId: string) => {
		if (!productId) return

		try {
			const product = availablePhytosanitaries.find(p => p._id === productId)
			if (product) {
				updatePhytosanitary(index, 'productId', productId)
				updatePhytosanitary(index, 'phytosanitaryType', product.name)
				updatePhytosanitary(index, 'price', product.pricePerUnit)
				updatePhytosanitary(index, 'brand', product.brand || '')
				updatePhytosanitary(index, 'supplier', product.supplier || '')
				updatePhytosanitary(index, 'purchaseDate', product.purchaseDate || '')
			}
		} catch (error) {
			console.error('Error loading product details:', error)
		}
	}

	const calculateTotalCost = () => {
		return formData.phytosanitaries.reduce((sum, p) => sum + p.cost, 0)
	}

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
				return
			}

			const updatedFormData = {
				...formData,
				totalCost: calculateTotalCost(),
				phytosanitaries: formData.phytosanitaries.map(p => ({
					...p,
					cost: p.phytosanitaryAmount * (p.price || 0)
				}))
			}

			// Llamar a la función onSubmit que ahora conectará con el backend
			await onSubmit(updatedFormData)
			onClose()
		} catch (error) {
			console.error('Error submitting phytosanitary day:', error)
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
				<div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
					<h2 className="text-xl font-bold">
						{existingDay ? 'Editar Día de Fitosanitarios' : 'Añadir Día de Fitosanitarios'}
					</h2>
					<button onClick={onClose} className={`p-2 rounded-lg transition-colors ${
						isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
					}`}>
						<X className="h-5 w-5" />
					</button>
				</div>

				<div className="p-6">
					<div className="mb-4">
						<p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
							Actividad: <span className="font-medium">{activityName}</span>
						</p>
					</div>

					<form onSubmit={handleSubmit} className="space-y-6">
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
								<button
									type="button"
									onClick={addPhytosanitary}
									className="flex items-center space-x-2 px-3 py-1 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
								>
									<Plus className="h-4 w-4" />
									<span>Añadir Fitosanitario</span>
								</button>
							</div>

							{formData.phytosanitaries.length === 0 ? (
								<div className={`p-4 border-2 border-dashed rounded-lg text-center ${
									isDarkMode ? 'border-gray-600 text-gray-400' : 'border-gray-300 text-gray-500'
								}`}>
									<p className="text-sm mb-2">No hay fitosanitarios añadidos</p>
									<p className="text-xs">
										{availablePhytosanitaries.length === 0 
											? 'No hay fitosanitarios registrados. Ve a "Gestión > Productos y Precios" para añadir fitosanitarios.'
											: 'Haz clic en "Añadir Fitosanitario" para comenzar'
										}
									</p>
								</div>
							) : (
								<div className="space-y-4">
									{formData.phytosanitaries.map((phytosanitary, index) => (
										<div key={index} className={`p-4 border rounded-lg transition-colors ${
											isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
										}`}>
											<div className="flex items-center justify-between mb-3">
												<h4 className="font-medium">Fitosanitario {index + 1}</h4>
												<button
													type="button"
													onClick={() => removePhytosanitary(index)}
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
														Seleccionar Fitosanitario
													</label>
													<select
														value={phytosanitary.productId}
														onChange={(e) => handlePhytosanitaryTypeChange(index, e.target.value)}
														className={`w-full px-3 py-2 border rounded-lg transition-colors ${
															isDarkMode 
																? 'bg-gray-700 border-gray-600 text-white' 
																: 'bg-white border-gray-300 text-gray-900'
														}`}
													>
														<option value="">
															{availablePhytosanitaries.length === 0 
																? 'No hay fitosanitarios disponibles' 
																: 'Seleccionar fitosanitario'
															}
														</option>
														{availablePhytosanitaries.map(product => (
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
															value={phytosanitary.phytosanitaryAmount}
															onChange={(e) => updatePhytosanitary(index, 'phytosanitaryAmount', parseFloat(e.target.value) || 0)}
															onFocus={handleNumberFocus}
															className={`flex-1 px-3 py-2 border rounded-lg transition-colors ${
																isDarkMode 
																	? 'bg-gray-700 border-gray-600 text-white' 
																	: 'bg-white border-gray-300 text-gray-900'
															}`}
														/>
														<select
															value={phytosanitary.unit || 'L'}
															onChange={(e) => updatePhytosanitary(index, 'unit', e.target.value)}
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
															</span> {phytosanitary.supplier}
														</div>
														<div>
															<span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
																Precio:
															</span> {(phytosanitary.price || 0)}€/{phytosanitary.unit || 'L'}
														</div>
													</div>
													<div className="mt-2">
														<span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
															Coste:
														</span> {(phytosanitary.phytosanitaryAmount * (phytosanitary.price || 0)).toFixed(2)}€
													</div>
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

						<div className={`p-4 rounded-lg ${
							isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
						}`}>
							<div className="flex justify-between items-center">
								<span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
									Coste Total del Día:
								</span>
								<span className="text-lg font-bold text-orange-600">
									{calculateTotalCost().toFixed(2)}€
								</span>
							</div>
						</div>

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
