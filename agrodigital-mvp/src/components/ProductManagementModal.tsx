import React, { useState, useEffect } from 'react'
import { X, Plus, Edit, Trash2, Package, Droplets, Search } from 'lucide-react'
import { 
	getAllActiveProducts, 
	addProduct, 
	updateProduct, 
	deleteProduct, 
	type ProductPrice 
} from '../data/productPrices'

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
	const [searchTerm, setSearchTerm] = useState('')
	const [selectedType, setSelectedType] = useState<'all' | 'fertilizer' | 'water'>('all')
	const [showAddForm, setShowAddForm] = useState(false)
	const [editingProduct, setEditingProduct] = useState<ProductPrice | null>(null)
	
	const [formData, setFormData] = useState({
		name: '',
		type: 'fertilizer' as 'fertilizer' | 'water',
		pricePerUnit: 0,
		unit: 'kg',
		category: '',
		description: '',
		active: true
	})

	useEffect(() => {
		if (isOpen) {
			loadProducts()
		}
	}, [isOpen])

	useEffect(() => {
		filterProducts()
	}, [products, searchTerm, selectedType])

	const loadProducts = () => {
		const allProducts = getAllActiveProducts()
		setProducts(allProducts)
	}

	const filterProducts = () => {
		let filtered = products

		// Filtrar por tipo
		if (selectedType !== 'all') {
			filtered = filtered.filter(product => product.type === selectedType)
		}

		// Filtrar por búsqueda
		if (searchTerm) {
			filtered = filtered.filter(product => 
				product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				product.category?.toLowerCase().includes(searchTerm.toLowerCase())
			)
		}

		setFilteredProducts(filtered)
	}

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		
		if (editingProduct) {
			// Actualizar producto existente
			updateProduct(editingProduct.id, formData)
		} else {
			// Añadir nuevo producto
			addProduct(formData)
		}
		
		// Limpiar formulario
		setFormData({
			name: '',
			type: 'fertilizer',
			pricePerUnit: 0,
			unit: 'kg',
			category: '',
			description: '',
			active: true
		})
		
		setEditingProduct(null)
		setShowAddForm(false)
		loadProducts()
	}

	const handleEdit = (product: ProductPrice) => {
		setEditingProduct(product)
		setFormData({
			name: product.name,
			type: product.type,
			pricePerUnit: product.pricePerUnit,
			unit: product.unit,
			category: product.category || '',
			description: product.description || '',
			active: product.active
		})
		setShowAddForm(true)
	}

	const handleDelete = (productId: string) => {
		if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
			deleteProduct(productId)
			loadProducts()
		}
	}

	const handleCancel = () => {
		setFormData({
			name: '',
			type: 'fertilizer',
			pricePerUnit: 0,
			unit: 'kg',
			category: '',
			description: '',
			active: true
		})
		setEditingProduct(null)
		setShowAddForm(false)
	}

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('es-ES', {
			style: 'currency',
			currency: 'EUR'
		}).format(amount)
	}

	if (!isOpen) return null

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div className={`relative w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-lg shadow-xl ${
				isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
			}`}>
				{/* Header */}
				<div className={`flex items-center justify-between p-6 border-b ${
					isDarkMode ? 'border-gray-700' : 'border-gray-200'
				}`}>
					<div className="flex items-center space-x-3">
						<Package className="h-6 w-6 text-blue-600" />
						<h2 className="text-xl font-semibold">Gestión de Productos</h2>
					</div>
					<button
						onClick={onClose}
						className={`p-2 rounded-lg transition-colors ${
							isDarkMode 
								? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
								: 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
						}`}
					>
						<X className="h-5 w-5" />
					</button>
				</div>

				{/* Content */}
				<div className="p-6 space-y-6">
					{/* Filtros y búsqueda */}
					<div className="flex flex-col sm:flex-row gap-4">
						<div className="flex-1">
							<div className="relative">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
								<input
									type="text"
									placeholder="Buscar productos..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className={`w-full pl-10 pr-4 py-2 border rounded-lg transition-colors ${
										isDarkMode 
											? 'bg-gray-700 border-gray-600 text-white' 
											: 'bg-white border-gray-300 text-gray-900'
									}`}
								/>
							</div>
						</div>
						<div className="flex gap-2">
							<select
								value={selectedType}
								onChange={(e) => setSelectedType(e.target.value as 'all' | 'fertilizer' | 'water')}
								className={`px-4 py-2 border rounded-lg transition-colors ${
									isDarkMode 
										? 'bg-gray-700 border-gray-600 text-white' 
										: 'bg-white border-gray-300 text-gray-900'
								}`}
							>
								<option value="all">Todos los productos</option>
								<option value="fertilizer">Fertilizantes</option>
								<option value="water">Agua</option>
							</select>
							<button
								onClick={() => setShowAddForm(true)}
								className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
							>
								<Plus className="h-4 w-4" />
								<span>Añadir Producto</span>
							</button>
						</div>
					</div>

					{/* Formulario de añadir/editar */}
					{showAddForm && (
						<div className={`p-4 rounded-lg border ${
							isDarkMode ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-50'
						}`}>
							<h3 className="text-lg font-medium mb-4">
								{editingProduct ? 'Editar Producto' : 'Añadir Nuevo Producto'}
							</h3>
							<form onSubmit={handleSubmit} className="space-y-4">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<label className={`block text-sm font-medium mb-2 ${
											isDarkMode ? 'text-gray-300' : 'text-gray-700'
										}`}>
											Nombre del Producto *
										</label>
										<input
											type="text"
											required
											value={formData.name}
											onChange={(e) => setFormData({ ...formData, name: e.target.value })}
											className={`w-full px-3 py-2 border rounded-lg transition-colors ${
												isDarkMode 
													? 'bg-gray-600 border-gray-500 text-white' 
													: 'bg-white border-gray-300 text-gray-900'
											}`}
											placeholder="Ej: NPK 15-15-15"
										/>
									</div>
									
									<div>
										<label className={`block text-sm font-medium mb-2 ${
											isDarkMode ? 'text-gray-300' : 'text-gray-700'
										}`}>
											Tipo de Producto *
										</label>
										<select
											required
											value={formData.type}
											onChange={(e) => setFormData({ ...formData, type: e.target.value as 'fertilizer' | 'water' })}
											className={`w-full px-3 py-2 border rounded-lg transition-colors ${
												isDarkMode 
													? 'bg-gray-600 border-gray-500 text-white' 
													: 'bg-white border-gray-300 text-gray-900'
											}`}
										>
											<option value="fertilizer">Fertilizante</option>
											<option value="water">Agua</option>
										</select>
									</div>
									
									<div>
										<label className={`block text-sm font-medium mb-2 ${
											isDarkMode ? 'text-gray-300' : 'text-gray-700'
										}`}>
											Precio por Unidad (€) *
										</label>
										<input
											type="number"
											required
											step="0.01"
											min="0"
											value={formData.pricePerUnit}
											onChange={(e) => setFormData({ ...formData, pricePerUnit: parseFloat(e.target.value) || 0 })}
											className={`w-full px-3 py-2 border rounded-lg transition-colors ${
												isDarkMode 
													? 'bg-gray-600 border-gray-500 text-white' 
													: 'bg-white border-gray-300 text-gray-900'
											}`}
											placeholder="0.00"
										/>
									</div>
									
									<div>
										<label className={`block text-sm font-medium mb-2 ${
											isDarkMode ? 'text-gray-300' : 'text-gray-700'
										}`}>
											Unidad *
										</label>
										<select
											required
											value={formData.unit}
											onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
											className={`w-full px-3 py-2 border rounded-lg transition-colors ${
												isDarkMode 
													? 'bg-gray-600 border-gray-500 text-white' 
													: 'bg-white border-gray-300 text-gray-900'
											}`}
										>
											<option value="kg">kg</option>
											<option value="g">g</option>
											<option value="L">L</option>
											<option value="ml">ml</option>
											<option value="m3">m³</option>
										</select>
									</div>
									
									<div>
										<label className={`block text-sm font-medium mb-2 ${
											isDarkMode ? 'text-gray-300' : 'text-gray-700'
										}`}>
											Categoría
										</label>
										<input
											type="text"
											value={formData.category}
											onChange={(e) => setFormData({ ...formData, category: e.target.value })}
											className={`w-full px-3 py-2 border rounded-lg transition-colors ${
												isDarkMode 
													? 'bg-gray-600 border-gray-500 text-white' 
													: 'bg-white border-gray-300 text-gray-900'
											}`}
											placeholder="Ej: NPK, Orgánico, etc."
										/>
									</div>
									
									<div>
										<label className={`block text-sm font-medium mb-2 ${
											isDarkMode ? 'text-gray-300' : 'text-gray-700'
										}`}>
											Estado
										</label>
										<label className="flex items-center space-x-2">
											<input
												type="checkbox"
												checked={formData.active}
												onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
												className="rounded border-gray-300 text-green-600 focus:ring-green-500"
											/>
											<span className="text-sm">Activo</span>
										</label>
									</div>
								</div>
								
								<div>
									<label className={`block text-sm font-medium mb-2 ${
										isDarkMode ? 'text-gray-300' : 'text-gray-700'
									}`}>
										Descripción
									</label>
									<textarea
										value={formData.description}
										onChange={(e) => setFormData({ ...formData, description: e.target.value })}
										rows={3}
										className={`w-full px-3 py-2 border rounded-lg transition-colors ${
											isDarkMode 
												? 'bg-gray-600 border-gray-500 text-white' 
												: 'bg-white border-gray-300 text-gray-900'
										}`}
										placeholder="Descripción del producto..."
									/>
								</div>
								
								<div className="flex justify-end space-x-3">
									<button
										type="button"
										onClick={handleCancel}
										className={`px-4 py-2 rounded-lg font-medium transition-colors ${
											isDarkMode 
												? 'bg-gray-600 text-gray-300 hover:bg-gray-500' 
												: 'bg-gray-200 text-gray-700 hover:bg-gray-300'
										}`}
									>
										Cancelar
									</button>
									<button
										type="submit"
										className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
									>
										{editingProduct ? 'Actualizar' : 'Añadir'} Producto
									</button>
								</div>
							</form>
						</div>
					)}

					{/* Lista de productos */}
					<div className={`p-4 rounded-lg border ${
						isDarkMode ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-50'
					}`}>
						<h3 className="text-lg font-medium mb-4">
							Productos ({filteredProducts.length})
						</h3>
						
						{filteredProducts.length === 0 ? (
							<div className="text-center py-8">
								<Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
								<p className={`text-lg ${
									isDarkMode ? 'text-gray-400' : 'text-gray-500'
								}`}>
									{searchTerm || selectedType !== 'all' 
										? 'No se encontraron productos con los filtros aplicados'
										: 'No hay productos registrados. Añade tu primer producto.'
									}
								</p>
								{!searchTerm && selectedType === 'all' && (
									<button
										onClick={() => setShowAddForm(true)}
										className="mt-4 flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors mx-auto"
									>
										<Plus className="h-4 w-4" />
										<span>Añadir Primer Producto</span>
									</button>
								)}
							</div>
						) : (
							<div className="space-y-3">
								{filteredProducts.map((product) => (
									<div key={product.id} className={`p-4 rounded-lg border ${
										isDarkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-white'
									}`}>
										<div className="flex items-center justify-between">
											<div className="flex items-center space-x-3">
												<div className={`p-2 rounded-lg ${
													product.type === 'fertilizer' 
														? 'bg-green-100 text-green-600' 
														: 'bg-blue-100 text-blue-600'
												}`}>
													{product.type === 'fertilizer' ? (
														<Package className="h-4 w-4" />
													) : (
														<Droplets className="h-4 w-4" />
													)}
												</div>
												<div>
													<h4 className="font-medium">{product.name}</h4>
													<div className="flex items-center space-x-4 text-sm text-gray-500">
														<span>{product.type === 'fertilizer' ? 'Fertilizante' : 'Agua'}</span>
														{product.category && (
															<span>Categoría: {product.category}</span>
														)}
														<span className="font-medium text-green-600">
															{formatCurrency(product.pricePerUnit)}/{product.unit}
														</span>
													</div>
													{product.description && (
														<p className="text-sm text-gray-500 mt-1">{product.description}</p>
													)}
												</div>
											</div>
											<div className="flex items-center space-x-2">
												<button
													onClick={() => handleEdit(product)}
													className={`p-2 rounded-lg transition-colors ${
														isDarkMode 
															? 'hover:bg-gray-600 text-gray-400 hover:text-white' 
															: 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
													}`}
												>
													<Edit className="h-4 w-4" />
												</button>
												<button
													onClick={() => handleDelete(product.id)}
													className="p-2 rounded-lg hover:bg-red-100 text-red-500 hover:text-red-700 transition-colors"
												>
													<Trash2 className="h-4 w-4" />
												</button>
											</div>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}

export default ProductManagementModal 