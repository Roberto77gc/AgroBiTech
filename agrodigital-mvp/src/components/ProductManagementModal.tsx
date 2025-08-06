import React, { useState, useEffect } from 'react'
import { X, Plus, Edit, Trash2, Package, Search } from 'lucide-react'
import type { ProductPrice } from '../types'
import { productAPI } from '../services/api'
import { toast } from 'react-toastify'

interface ProductManagementModalProps {
	isOpen: boolean
	onClose: () => void
	isDarkMode: boolean
}

const ProductManagementModal: React.FC<ProductManagementModalProps> = ({
	isOpen,
	onClose,
	isDarkMode
}) => {
	const [products, setProducts] = useState<ProductPrice[]>([])
	const [filteredProducts, setFilteredProducts] = useState<ProductPrice[]>([])
	const [selectedType, setSelectedType] = useState<'fertilizer' | 'water' | 'phytosanitary'>('fertilizer')
	const [searchTerm, setSearchTerm] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [showForm, setShowForm] = useState(false)
	const [editingProduct, setEditingProduct] = useState<ProductPrice | null>(null)
	const [formData, setFormData] = useState({
		name: '',
		type: 'fertilizer' as 'fertilizer' | 'water' | 'phytosanitary',
		pricePerUnit: '',
		unit: '',
		category: '',
		description: ''
	})

	// Cargar productos al abrir el modal
	useEffect(() => {
		if (isOpen) {
			loadProducts()
		}
	}, [isOpen])

	// Filtrar productos cuando cambie el tipo o búsqueda
	useEffect(() => {
		let filtered = products.filter(product => product.type === selectedType)
		
		if (searchTerm) {
			filtered = filtered.filter(product =>
				product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				product.category?.toLowerCase().includes(searchTerm.toLowerCase())
			)
		}
		
		setFilteredProducts(filtered)
	}, [products, selectedType, searchTerm])

	const loadProducts = async () => {
		try {
			setIsLoading(true)
			const response = await productAPI.getAll()
			if (response.success) {
				setProducts(response.products)
			} else {
				toast.error('Error al cargar productos')
			}
		} catch (error) {
			console.error('Error loading products:', error)
			toast.error('Error al cargar productos')
		} finally {
			setIsLoading(false)
		}
	}

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target
		setFormData(prev => ({
			...prev,
			[name]: value
		}))
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		
		if (!formData.name || !formData.pricePerUnit || !formData.unit) {
			toast.error('Por favor completa todos los campos obligatorios')
			return
		}

		try {
			setIsLoading(true)
			const productData = {
				...formData,
				pricePerUnit: parseFloat(formData.pricePerUnit),
				active: true
			}

			if (editingProduct) {
				// Actualizar producto existente
				const response = await productAPI.update(editingProduct._id, productData)
				if (response.success) {
					toast.success('Producto actualizado correctamente')
					await loadProducts()
					handleCloseForm()
				} else {
					toast.error('Error al actualizar producto')
				}
			} else {
				// Crear nuevo producto
				const response = await productAPI.create(productData)
				if (response.success) {
					toast.success('Producto creado correctamente')
					await loadProducts()
					handleCloseForm()
				} else {
					toast.error('Error al crear producto')
				}
			}
		} catch (error) {
			console.error('Error saving product:', error)
			toast.error('Error al guardar producto')
		} finally {
			setIsLoading(false)
		}
	}

	const handleEdit = (product: ProductPrice) => {
		setEditingProduct(product)
		setFormData({
			name: product.name,
			type: product.type,
			pricePerUnit: product.pricePerUnit.toString(),
			unit: product.unit,
			category: product.category || '',
			description: product.description || ''
		})
		setShowForm(true)
	}

	const handleDelete = async (productId: string) => {
		if (!window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
			return
		}

		try {
			setIsLoading(true)
			const response = await productAPI.delete(productId)
			if (response.success) {
				toast.success('Producto eliminado correctamente')
				await loadProducts()
			} else {
				toast.error('Error al eliminar producto')
			}
		} catch (error) {
			console.error('Error deleting product:', error)
			toast.error('Error al eliminar producto')
		} finally {
			setIsLoading(false)
		}
	}

	const handleCloseForm = () => {
		setShowForm(false)
		setEditingProduct(null)
		setFormData({
			name: '',
			type: 'fertilizer',
			pricePerUnit: '',
			unit: '',
			category: '',
			description: ''
		})
	}



	if (!isOpen) return null

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div className={`relative w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-lg shadow-xl ${
				isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
			}`}>
				{/* Header */}
				<div className={`flex items-center justify-between p-6 border-b ${
					isDarkMode ? 'border-gray-700' : 'border-gray-200'
				}`}>
					<div className="flex items-center space-x-3">
						<Package className="w-6 h-6 text-blue-500" />
						<h2 className="text-xl font-semibold">Gestión de Productos y Precios</h2>
					</div>
					<button
						onClick={onClose}
						className={`p-2 rounded-lg hover:bg-opacity-80 ${
							isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
						}`}
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				<div className="flex h-[calc(90vh-120px)]">
					{/* Sidebar */}
					<div className={`w-80 border-r p-6 overflow-y-auto ${
						isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'
					}`}>
						{/* Filtros */}
						<div className="space-y-4">
							<div>
								<label className="block text-sm font-medium mb-2">Tipo de Producto</label>
								<select
									value={selectedType}
									onChange={(e) => setSelectedType(e.target.value as any)}
									className={`w-full p-3 rounded-lg border ${
										isDarkMode 
											? 'bg-gray-800 border-gray-600 text-white' 
											: 'bg-white border-gray-300 text-gray-900'
									}`}
								>
									<option value="fertilizer">Fertilizantes</option>
									<option value="water">Agua</option>
									<option value="phytosanitary">Fitosanitarios</option>
								</select>
							</div>

							<div>
								<label className="block text-sm font-medium mb-2">Buscar</label>
								<div className="relative">
									<Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
										isDarkMode ? 'text-gray-400' : 'text-gray-500'
									}`} />
									<input
										type="text"
										placeholder="Buscar productos..."
										value={searchTerm}
										onChange={(e) => setSearchTerm(e.target.value)}
										className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
											isDarkMode 
												? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
												: 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
										}`}
									/>
								</div>
							</div>

							<button
								onClick={() => setShowForm(true)}
								className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors"
							>
								<Plus className="w-4 h-4" />
								<span>Nuevo Producto</span>
							</button>
						</div>

						{/* Lista de productos */}
						<div className="mt-6 space-y-2">
							{isLoading ? (
								<div className="text-center py-4">
									<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
								</div>
							) : filteredProducts.length === 0 ? (
								<div className={`text-center py-8 ${
									isDarkMode ? 'text-gray-400' : 'text-gray-500'
								}`}>
									<Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
									<p>No hay productos</p>
								</div>
							) : (
								filteredProducts.map((product) => (
									<div
										key={product._id}
										className={`p-4 rounded-lg border cursor-pointer transition-colors ${
											isDarkMode 
												? 'border-gray-700 hover:bg-gray-800' 
												: 'border-gray-200 hover:bg-gray-50'
										}`}
										onClick={() => handleEdit(product)}
									>
										<div className="flex items-center justify-between">
											<div className="flex-1">
												<h3 className="font-medium">{product.name}</h3>
												<p className={`text-sm ${
													isDarkMode ? 'text-gray-400' : 'text-gray-600'
												}`}>
													{product.pricePerUnit}€/{product.unit}
												</p>
												{product.category && (
													<span className={`inline-block px-2 py-1 text-xs rounded ${
														isDarkMode 
															? 'bg-gray-700 text-gray-300' 
															: 'bg-gray-100 text-gray-600'
													}`}>
														{product.category}
													</span>
												)}
											</div>
											<div className="flex space-x-2">
												<button
													onClick={(e) => {
														e.stopPropagation()
														handleEdit(product)
													}}
													className={`p-2 rounded hover:bg-opacity-80 ${
														isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
													}`}
												>
													<Edit className="w-4 h-4" />
												</button>
												<button
													onClick={(e) => {
														e.stopPropagation()
														handleDelete(product._id)
													}}
													className="p-2 rounded hover:bg-red-100 text-red-500"
												>
													<Trash2 className="w-4 h-4" />
												</button>
											</div>
										</div>
									</div>
								))
							)}
						</div>
					</div>

					{/* Formulario */}
					{showForm && (
						<div className="flex-1 p-6 overflow-y-auto">
							<div className="max-w-2xl mx-auto">
								<div className="flex items-center justify-between mb-6">
									<h3 className="text-lg font-semibold">
										{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
									</h3>
									<button
										onClick={handleCloseForm}
										className={`p-2 rounded-lg hover:bg-opacity-80 ${
											isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
										}`}
									>
										<X className="w-5 h-5" />
									</button>
								</div>

								<form onSubmit={handleSubmit} className="space-y-6">
									<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
										<div>
											<label className="block text-sm font-medium mb-2">
												Nombre del Producto *
											</label>
											<input
												type="text"
												name="name"
												value={formData.name}
												onChange={handleInputChange}
												required
												className={`w-full p-3 rounded-lg border ${
													isDarkMode 
														? 'bg-gray-800 border-gray-600 text-white' 
														: 'bg-white border-gray-300 text-gray-900'
												}`}
											/>
										</div>

										<div>
											<label className="block text-sm font-medium mb-2">
												Tipo de Producto *
											</label>
											<select
												name="type"
												value={formData.type}
												onChange={handleInputChange}
												required
												className={`w-full p-3 rounded-lg border ${
													isDarkMode 
														? 'bg-gray-800 border-gray-600 text-white' 
														: 'bg-white border-gray-300 text-gray-900'
												}`}
											>
												<option value="fertilizer">Fertilizante</option>
												<option value="water">Agua</option>
												<option value="phytosanitary">Fitosanitario</option>
											</select>
										</div>

										<div>
											<label className="block text-sm font-medium mb-2">
												Precio por Unidad (€) *
											</label>
											<input
												type="number"
												name="pricePerUnit"
												value={formData.pricePerUnit}
												onChange={handleInputChange}
												step="0.01"
												min="0"
												required
												onFocus={(e) => {
													if (e.target.value === '0') {
														e.target.value = ''
													}
												}}
												className={`w-full p-3 rounded-lg border ${
													isDarkMode 
														? 'bg-gray-800 border-gray-600 text-white' 
														: 'bg-white border-gray-300 text-gray-900'
												}`}
											/>
										</div>

										<div>
											<label className="block text-sm font-medium mb-2">
												Unidad *
											</label>
											<input
												type="text"
												name="unit"
												value={formData.unit}
												onChange={handleInputChange}
												placeholder="kg, L, m³, etc."
												required
												className={`w-full p-3 rounded-lg border ${
													isDarkMode 
														? 'bg-gray-800 border-gray-600 text-white' 
														: 'bg-white border-gray-300 text-gray-900'
												}`}
											/>
										</div>

										<div>
											<label className="block text-sm font-medium mb-2">
												Categoría
											</label>
											<input
												type="text"
												name="category"
												value={formData.category}
												onChange={handleInputChange}
												placeholder="Categoría opcional"
												className={`w-full p-3 rounded-lg border ${
													isDarkMode 
														? 'bg-gray-800 border-gray-600 text-white' 
														: 'bg-white border-gray-300 text-gray-900'
												}`}
											/>
										</div>
									</div>

									<div>
										<label className="block text-sm font-medium mb-2">
											Descripción
										</label>
										<textarea
											name="description"
											value={formData.description}
											onChange={handleInputChange}
											rows={3}
											placeholder="Descripción opcional del producto..."
											className={`w-full p-3 rounded-lg border ${
												isDarkMode 
													? 'bg-gray-800 border-gray-600 text-white' 
													: 'bg-white border-gray-300 text-gray-900'
											}`}
										/>
									</div>

									<div className="flex justify-end space-x-4 pt-6">
										<button
											type="button"
											onClick={handleCloseForm}
											className={`px-6 py-3 rounded-lg border ${
												isDarkMode 
													? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
													: 'border-gray-300 text-gray-700 hover:bg-gray-50'
											}`}
										>
											Cancelar
										</button>
										<button
											type="submit"
											disabled={isLoading}
											className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white px-6 py-3 rounded-lg flex items-center space-x-2"
										>
											{isLoading ? (
												<>
													<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
													<span>Guardando...</span>
												</>
											) : (
												<>
													<Plus className="w-4 h-4" />
													<span>{editingProduct ? 'Actualizar' : 'Crear'} Producto</span>
												</>
											)}
										</button>
									</div>
								</form>
							</div>
						</div>
					)}

					{/* Vista previa cuando no hay formulario */}
					{!showForm && (
						<div className="flex-1 p-6 flex items-center justify-center">
							<div className={`text-center ${
								isDarkMode ? 'text-gray-400' : 'text-gray-500'
							}`}>
								<Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
								<p className="text-lg font-medium mb-2">Gestión de Productos</p>
								<p>Selecciona un producto para editar o crea uno nuevo</p>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

export default ProductManagementModal 