import React, { useState, useEffect } from 'react'
import { X, Plus, Trash2, DollarSign, Users, Wrench, Package, Truck } from 'lucide-react'
import type { OtherExpenseRecord, ProductPrice } from '../types'
import { productAPI } from '../services/api'

interface OtherExpensesModalProps {
	isOpen: boolean
	onClose: () => void
	onSubmit: (expenses: OtherExpenseRecord[]) => void
	existingExpenses?: OtherExpenseRecord[]
	isDarkMode: boolean
}

const OtherExpensesModal: React.FC<OtherExpensesModalProps> = ({
	isOpen,
	onClose,
	onSubmit,
	existingExpenses = [],
	isDarkMode
}) => {
	const [expenses, setExpenses] = useState<OtherExpenseRecord[]>(existingExpenses)
	const [availableProducts, setAvailableProducts] = useState<ProductPrice[]>([])
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [errors, setErrors] = useState<{ [key: string]: string }>({})

	useEffect(() => {
		if (isOpen) {
			loadData()
		}
	}, [isOpen])

	const loadData = async () => {
		try {
			console.log('🔄 Cargando productos de otros gastos...')
			
			const response = await productAPI.getByType('others')
			
			console.log('📦 Respuesta otros productos:', response)
			
			const products = response?.products || response || []
			
			console.log('📦 Productos extraídos:', products)
			
			setAvailableProducts(Array.isArray(products) ? products : [])
		} catch (error) {
			console.error('❌ Error loading other products:', error)
			setAvailableProducts([])
		}
	}

	const addExpense = () => {
		const newExpense: OtherExpenseRecord = {
			expenseType: '',
			expenseAmount: 0,
			expenseUnit: 'unidad',
			cost: 0,
			price: 0,
			unit: 'unidad',
			brand: '',
			supplier: '',
			purchaseDate: '',
			notes: ''
		}
		setExpenses(prev => [...prev, newExpense])
	}

	const updateExpense = (index: number, field: keyof OtherExpenseRecord, value: any) => {
		console.log(`🔄 Actualizando gasto ${index}, campo ${field}:`, value)
		setExpenses(prev => {
			const newExpenses = prev.map((expense, i) => 
				i === index ? { ...expense, [field]: value } : expense
			)
			console.log(`📦 Nuevo estado de gastos:`, newExpenses)
			return newExpenses
		})
	}

	const removeExpense = (index: number) => {
		setExpenses(prev => prev.filter((_, i) => i !== index))
	}

	const handleProductChange = async (index: number, productId: string) => {
		console.log('Seleccionando producto:', productId, 'para índice:', index)
		
		if (!productId) {
			updateExpense(index, 'productId', '')
			updateExpense(index, 'expenseType', '')
			updateExpense(index, 'price', 0)
			updateExpense(index, 'brand', '')
			updateExpense(index, 'supplier', '')
			updateExpense(index, 'purchaseDate', '')
			return
		}

		try {
			const product = availableProducts.find(p => p._id === productId)
			console.log('Producto encontrado:', product)
			
			if (product) {
				updateExpense(index, 'productId', productId)
				updateExpense(index, 'expenseType', product.name)
				updateExpense(index, 'price', product.pricePerUnit || 0)
				updateExpense(index, 'brand', product.brand || '')
				updateExpense(index, 'supplier', product.supplier || '')
				updateExpense(index, 'purchaseDate', product.purchaseDate || '')
				updateExpense(index, 'unit', product.unit || 'unidad')
				
				console.log('Gasto actualizado:', {
					productId,
					expenseType: product.name,
					price: product.pricePerUnit,
					brand: product.brand,
					supplier: product.supplier
				})
			} else {
				console.error('Producto no encontrado en availableProducts')
			}
		} catch (error) {
			console.error('Error loading product details:', error)
		}
	}

	const calculateTotalCost = () => {
		return expenses.reduce((sum, expense) => {
			const cost = expense.expenseAmount * (expense.price || 0)
			return sum + cost
		}, 0)
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setIsSubmitting(true)

		try {
			// Validar formulario
			const newErrors: { [key: string]: string } = {}
			
			if (expenses.length === 0) {
				newErrors.expenses = 'Debe añadir al menos un gasto'
			}

			// Validar cada gasto
			expenses.forEach((expense, index) => {
				if (!expense.expenseType) {
					newErrors[`expense_${index}`] = 'Debe seleccionar un tipo de gasto'
				}
				if (expense.expenseAmount <= 0) {
					newErrors[`expense_${index}`] = 'La cantidad debe ser mayor a 0'
				}
			})

			if (Object.keys(newErrors).length > 0) {
				setErrors(newErrors)
				return
			}

			// Calcular costos
			const updatedExpenses = expenses.map(expense => ({
				...expense,
				cost: expense.expenseAmount * (expense.price || 0)
			}))

			// Llamar a la función onSubmit
			await onSubmit(updatedExpenses)
			onClose()
		} catch (error) {
			console.error('Error submitting other expenses:', error)
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleNumberFocus = (e: React.FocusEvent<HTMLInputElement>) => {
		const value = e.target.value
		if (value === '0' || value === '0.00' || value === '0.0') {
			e.target.value = ''
			setTimeout(() => {
				e.target.select()
			}, 10)
		} else {
			e.target.select()
		}
	}

	const handleNumberBlur = (e: React.FocusEvent<HTMLInputElement>) => {
		if (e.target.value === '' || e.target.value === null || e.target.value === undefined) {
			e.target.value = '0'
		}
	}

	const getExpenseIcon = (expenseType: string) => {
		const type = expenseType.toLowerCase()
		if (type.includes('mano') || type.includes('jornal') || type.includes('labor')) {
			return <Users className="h-4 w-4" />
		} else if (type.includes('maquin') || type.includes('tractor') || type.includes('equipo')) {
			return <Truck className="h-4 w-4" />
		} else if (type.includes('herramient') || type.includes('material')) {
			return <Wrench className="h-4 w-4" />
		} else {
			return <Package className="h-4 w-4" />
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
					<h2 className="text-xl font-bold flex items-center space-x-2">
						<DollarSign className="h-6 w-6 text-purple-600" />
						<span>Gastos Adicionales</span>
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
					<form onSubmit={handleSubmit} className="space-y-6">
						{/* Gastos */}
						<div>
							<div className="flex items-center justify-between mb-4">
								<label className={`text-sm font-medium ${
									isDarkMode ? 'text-gray-300' : 'text-gray-700'
								}`}>
									Otros Gastos (Mano de obra, maquinaria, materiales, etc.)
								</label>
								<button
									type="button"
									onClick={addExpense}
									className="flex items-center space-x-2 px-3 py-1 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
								>
									<Plus className="h-4 w-4" />
									<span>Añadir Gasto</span>
								</button>
							</div>

							{expenses.length === 0 ? (
								<div className={`p-4 border-2 border-dashed rounded-lg text-center ${
									isDarkMode ? 'border-gray-600 text-gray-400' : 'border-gray-300 text-gray-500'
								}`}>
									<p className="text-sm mb-2">No hay gastos añadidos</p>
									<p className="text-xs">
										{availableProducts.length === 0 
											? 'No hay productos registrados. Ve a "Gestión > Productos y Precios" para añadir productos de otros gastos.'
											: 'Haz clic en "Añadir Gasto" para comenzar'
										}
									</p>
								</div>
							) : (
								<div className="space-y-4">
									{expenses.map((expense, index) => (
										<div
											key={index}
											className={`p-4 border rounded-lg transition-colors ${
												isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
											}`}
										>
											<div className="flex items-center justify-between mb-3">
												<h4 className="font-medium flex items-center space-x-2">
													{getExpenseIcon(expense.expenseType)}
													<span>Gasto {index + 1}</span>
												</h4>
												<button
													type="button"
													onClick={() => removeExpense(index)}
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
														Tipo de Gasto
													</label>
													<select
														value={expense.productId}
														onChange={(e) => handleProductChange(index, e.target.value)}
														className={`w-full px-3 py-2 border rounded-lg transition-colors ${
															isDarkMode 
																? 'bg-gray-700 border-gray-600 text-white' 
																: 'bg-white border-gray-300 text-gray-900'
														}`}
													>
														<option value="">
															{availableProducts.length === 0 
																? 'No hay productos disponibles' 
																: 'Seleccionar tipo de gasto'
															}
														</option>
														{availableProducts.map(product => (
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
															value={expense.expenseAmount}
															onChange={(e) => updateExpense(index, 'expenseAmount', parseFloat(e.target.value) || 0)}
															onFocus={handleNumberFocus}
															onBlur={handleNumberBlur}
															className={`flex-1 px-3 py-2 border rounded-lg transition-colors ${
																isDarkMode 
																	? 'bg-gray-700 border-gray-600 text-white' 
																	: 'bg-white border-gray-300 text-gray-900'
															}`}
														/>
														<select
															value={expense.unit || 'unidad'}
															onChange={(e) => updateExpense(index, 'unit', e.target.value)}
															className={`px-3 py-2 border rounded-lg transition-colors ${
																isDarkMode 
																	? 'bg-gray-700 border-gray-600 text-white' 
																	: 'bg-white border-gray-300 text-gray-900'
															}`}
														>
															<option value="unidad">unidad</option>
															<option value="hora">hora</option>
															<option value="día">día</option>
															<option value="kg">kg</option>
															<option value="L">L</option>
															<option value="m2">m²</option>
															<option value="m3">m³</option>
														</select>
													</div>
												</div>
											</div>

											{/* Información del producto */}
											{expense.productId && (
												<div className="mt-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
													<div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
														<div>
															<span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
																Marca:
															</span> {expense.brand}
														</div>
														<div>
															<span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
																Proveedor:
															</span> {expense.supplier}
														</div>
														<div>
															<span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
																Precio:
															</span> {(expense.price || 0)}€/{expense.unit || 'unidad'}
														</div>
													</div>
													<div className="mt-2">
														<span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
															Coste:
														</span> {(expense.expenseAmount * (expense.price || 0)).toFixed(2)}€
													</div>
												</div>
											)}

											{errors[`expense_${index}`] && (
												<p className="text-red-500 text-sm mt-2">{errors[`expense_${index}`]}</p>
											)}
										</div>
									))}
								</div>
							)}

							{errors.expenses && (
								<p className="text-red-500 text-sm mt-2">{errors.expenses}</p>
							)}
						</div>

						{/* Coste Total */}
						<div className={`p-4 rounded-lg ${
							isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
						}`}>
							<div className="flex justify-between items-center">
								<span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
									Coste Total de Otros Gastos:
								</span>
								<span className="text-lg font-bold text-purple-600">
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
								className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
							>
								{isSubmitting ? 'Guardando...' : 'Guardar Gastos'}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	)
}

export default OtherExpensesModal
