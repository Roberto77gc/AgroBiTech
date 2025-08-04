import React, { useState, useEffect } from 'react'
import { 
	X, 
	Plus, 
	Package, 
	Edit3, 
	Trash2, 
	AlertTriangle,
	Save,
	Search
} from 'lucide-react'
import { toast } from 'react-toastify'
import type { InventoryProduct, ProductCategory } from '../types'

interface InventoryModalProps {
	isOpen: boolean
	onClose: () => void
	onProductAdded: () => void
	onProductUpdated: () => void
	onProductDeleted: () => void
	isDarkMode: boolean
}

const PRODUCT_CATEGORIES: { value: ProductCategory; label: string; icon: string }[] = [
	{ value: 'fertilizantes', label: 'Fertilizantes', icon: '🌱' },
	{ value: 'fitosanitarios', label: 'Fitosanitarios', icon: '🛡️' },
	{ value: 'semillas', label: 'Semillas', icon: '🌾' },
	{ value: 'herramientas', label: 'Herramientas', icon: '🔧' },
	{ value: 'maquinaria', label: 'Maquinaria', icon: '🚜' },
	{ value: 'combustible', label: 'Combustible', icon: '⛽' },
	{ value: 'otros', label: 'Otros', icon: '📦' }
]

const UNITS = ['kg', 'l', 'unidades', 'm²', 'ha', 'toneladas', 'litros']

const InventoryModal: React.FC<InventoryModalProps> = ({
	isOpen,
	onClose,
	onProductAdded,
	onProductUpdated,
	onProductDeleted,
	isDarkMode
}) => {
	const [products, setProducts] = useState<InventoryProduct[]>([])
	const [filteredProducts, setFilteredProducts] = useState<InventoryProduct[]>([])
	const [searchTerm, setSearchTerm] = useState('')
	const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all')
	const [isLoading, setIsLoading] = useState(false)
	const [editingProduct, setEditingProduct] = useState<InventoryProduct | null>(null)
	const [showForm, setShowForm] = useState(false)

	// Form state
	const [formData, setFormData] = useState({
		name: '',
		category: 'fertilizantes' as ProductCategory,
		description: '',
		quantity: 0,
		unit: 'kg',
		minStock: 0,
		price: 0,
		supplier: '',
		location: '',
		notes: ''
	})

	useEffect(() => {
		if (isOpen) {
			loadProducts()
		}
	}, [isOpen])

	useEffect(() => {
		filterProducts()
	}, [products, searchTerm, selectedCategory])

	const filterProducts = () => {
		let filtered = products

		if (searchTerm) {
			filtered = filtered.filter(product =>
				product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
				product.supplier?.toLowerCase().includes(searchTerm.toLowerCase())
			)
		}

		if (selectedCategory !== 'all') {
			filtered = filtered.filter(product => product.category === selectedCategory)
		}

		setFilteredProducts(filtered)
	}

	const loadProducts = async () => {
		setIsLoading(true)
		try {
			const token = localStorage.getItem('token')
			const response = await fetch('http://localhost:3000/api/inventory', {
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				}
			})

			if (response.ok) {
				const data = await response.json()
				setProducts(data.products || [])
			} else {
				toast.error('Error al cargar el inventario')
			}
		} catch (error) {
			console.error('Error loading products:', error)
			toast.error('Error de conexión')
		} finally {
			setIsLoading(false)
		}
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setIsLoading(true)

		try {
			const token = localStorage.getItem('token')
			const url = editingProduct 
				? `http://localhost:3000/api/inventory/${editingProduct._id}`
				: 'http://localhost:3000/api/inventory'
			
			const method = editingProduct ? 'PUT' : 'POST'

			const response = await fetch(url, {
				method,
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(formData)
			})

			if (response.ok) {
				toast.success(editingProduct ? 'Producto actualizado' : 'Producto añadido')
				resetForm()
				loadProducts()
				editingProduct ? onProductUpdated() : onProductAdded()
			} else {
				const error = await response.json()
				toast.error(error.message || 'Error al guardar')
			}
		} catch (error) {
			console.error('Error saving product:', error)
			toast.error('Error de conexión')
		} finally {
			setIsLoading(false)
		}
	}

	const handleEdit = (product: InventoryProduct) => {
		setEditingProduct(product)
		setFormData({
			name: product.name,
			category: product.category,
			description: product.description || '',
			quantity: product.quantity,
			unit: product.unit,
			minStock: product.minStock,
			price: product.price,
			supplier: product.supplier || '',
			location: product.location || '',
			notes: product.notes || ''
		})
		setShowForm(true)
	}

	const handleDelete = async (productId: string) => {
		if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) return

		setIsLoading(true)
		try {
			const token = localStorage.getItem('token')
			const response = await fetch(`http://localhost:3000/api/inventory/${productId}`, {
				method: 'DELETE',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				}
			})

			if (response.ok) {
				toast.success('Producto eliminado')
				loadProducts()
				onProductDeleted()
			} else {
				toast.error('Error al eliminar')
			}
		} catch (error) {
			console.error('Error deleting product:', error)
			toast.error('Error de conexión')
		} finally {
			setIsLoading(false)
		}
	}

	const resetForm = () => {
		setFormData({
			name: '',
			category: 'fertilizantes',
			description: '',
			quantity: 0,
			unit: 'kg',
			minStock: 0,
			price: 0,
			supplier: '',
			location: '',
			notes: ''
		})
		setEditingProduct(null)
		setShowForm(false)
	}

	const getCategoryIcon = (category: ProductCategory) => {
		return PRODUCT_CATEGORIES.find(cat => cat.value === category)?.icon || '📦'
	}

	const getCategoryLabel = (category: ProductCategory) => {
		return PRODUCT_CATEGORIES.find(cat => cat.value === category)?.label || 'Otros'
	}

	const isLowStock = (product: InventoryProduct) => {
		return product.quantity <= product.minStock
	}

	if (!isOpen) return null

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div className={`w-full max-w-6xl max-h-[90vh] rounded-xl shadow-2xl transition-colors ${
				isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
			}`}>
				{/* Header */}
				<div className={`flex items-center justify-between p-6 border-b ${
					isDarkMode ? 'border-gray-700' : 'border-gray-200'
				}`}>
					<div className="flex items-center space-x-3">
						<Package className="h-6 w-6 text-green-500" />
						<h2 className="text-xl font-bold">Gestión de Inventario</h2>
					</div>
					<div className="flex items-center space-x-2">
						<button
							onClick={() => setShowForm(true)}
							className={`flex items-center space-x-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm font-medium`}
						>
							<Plus className="h-4 w-4" />
							<span>Nuevo Producto</span>
						</button>
						<button
							onClick={onClose}
							className={`p-2 rounded-lg transition-colors ${
								isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
							}`}
						>
							<X className="h-5 w-5" />
						</button>
					</div>
				</div>

				<div className="flex h-[calc(90vh-120px)]">
					{/* Lista de productos */}
					<div className={`flex-1 border-r ${
						isDarkMode ? 'border-gray-700' : 'border-gray-200'
					}`}>
						{/* Filtros */}
						<div className="p-4 space-y-4">
							{/* Búsqueda */}
							<div className="relative">
								<Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
									isDarkMode ? 'text-gray-400' : 'text-gray-500'
								}`} />
								<input
									type="text"
									placeholder="Buscar productos..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className={`w-full pl-10 pr-4 py-2 rounded-lg border transition-colors ${
										isDarkMode 
											? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
											: 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
									}`}
								/>
							</div>

							{/* Filtro por categoría */}
							<div className="flex flex-wrap gap-2">
								<button
									onClick={() => setSelectedCategory('all')}
									className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
										selectedCategory === 'all'
											? 'bg-green-500 text-white'
											: isDarkMode
												? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
												: 'bg-gray-100 text-gray-600 hover:bg-gray-200'
									}`}
								>
									Todos
								</button>
								{PRODUCT_CATEGORIES.map(category => (
									<button
										key={category.value}
										onClick={() => setSelectedCategory(category.value)}
										className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
											selectedCategory === category.value
												? 'bg-green-500 text-white'
												: isDarkMode
													? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
													: 'bg-gray-100 text-gray-600 hover:bg-gray-200'
										}`}
									>
										{category.icon} {category.label}
									</button>
								))}
							</div>
						</div>

						{/* Lista */}
						<div className="flex-1 overflow-y-auto p-4">
							{isLoading ? (
								<div className="flex items-center justify-center py-8">
									<div className="animate-spin rounded-full h-8 w-8 border-2 border-green-500 border-t-transparent"></div>
								</div>
							) : filteredProducts.length === 0 ? (
								<div className="text-center py-8">
									<Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
									<h3 className={`text-lg font-medium mb-2 ${
										isDarkMode ? 'text-gray-300' : 'text-gray-900'
									}`}>
										No hay productos
									</h3>
									<p className={`text-sm ${
										isDarkMode ? 'text-gray-400' : 'text-gray-500'
									}`}>
										Comienza añadiendo tu primer producto al inventario
									</p>
								</div>
							) : (
								<div className="space-y-3">
									{filteredProducts.map(product => (
										<div
											key={product._id}
											className={`p-4 rounded-lg border transition-colors ${
												isDarkMode 
													? 'bg-gray-700 border-gray-600 hover:bg-gray-600' 
													: 'bg-white border-gray-200 hover:bg-gray-50'
											} ${isLowStock(product) ? 'border-red-300 bg-red-50 dark:bg-red-900/20' : ''}`}
										>
											<div className="flex items-center justify-between">
												<div className="flex items-center space-x-3 flex-1">
													<div className="text-2xl">
														{getCategoryIcon(product.category)}
													</div>
													<div className="flex-1 min-w-0">
														<div className="flex items-center space-x-2">
															<h3 className={`font-medium ${
																isDarkMode ? 'text-white' : 'text-gray-900'
															}`}>
																{product.name}
															</h3>
															{isLowStock(product) && (
																<AlertTriangle className="h-4 w-4 text-red-500" />
															)}
														</div>
														<p className={`text-sm ${
															isDarkMode ? 'text-gray-300' : 'text-gray-500'
														}`}>
															{getCategoryLabel(product.category)}
														</p>
														<div className="flex items-center space-x-4 mt-1">
															<span className={`text-sm font-medium ${
																isLowStock(product) ? 'text-red-600' : 'text-green-600'
															}`}>
																{product.quantity} {product.unit}
															</span>
															<span className={`text-sm ${
																isDarkMode ? 'text-gray-400' : 'text-gray-500'
															}`}>
																€{product.price.toFixed(2)}
															</span>
														</div>
													</div>
												</div>
												<div className="flex items-center space-x-2">
													<button
														onClick={() => handleEdit(product)}
														className={`p-2 rounded-lg transition-colors ${
															isDarkMode 
																? 'hover:bg-gray-600 text-gray-400 hover:text-blue-400' 
																: 'hover:bg-gray-200 text-gray-500 hover:text-blue-600'
														}`}
														title="Editar"
													>
														<Edit3 className="h-4 w-4" />
													</button>
													<button
														onClick={() => product._id && handleDelete(product._id)}
														className={`p-2 rounded-lg transition-colors ${
															isDarkMode 
																? 'hover:bg-gray-600 text-gray-400 hover:text-red-400' 
																: 'hover:bg-gray-200 text-gray-500 hover:text-red-600'
														}`}
														title="Eliminar"
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

					{/* Formulario */}
					{showForm && (
						<div className="w-96 p-6">
							<div className="flex items-center justify-between mb-6">
								<h3 className="text-lg font-semibold">
									{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
								</h3>
								<button
									onClick={resetForm}
									className={`p-2 rounded-lg transition-colors ${
										isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
									}`}
								>
									<X className="h-4 w-4" />
								</button>
							</div>

							<form onSubmit={handleSubmit} className="space-y-4">
								{/* Nombre */}
								<div>
									<label className={`block text-sm font-medium mb-2 ${
										isDarkMode ? 'text-gray-300' : 'text-gray-700'
									}`}>
										Nombre del producto *
									</label>
									<input
										type="text"
										required
										value={formData.name}
										onChange={(e) => setFormData({...formData, name: e.target.value})}
										className={`w-full px-3 py-2 rounded-lg border transition-colors ${
											isDarkMode 
												? 'bg-gray-700 border-gray-600 text-white' 
												: 'bg-white border-gray-300 text-gray-900'
										}`}
									/>
								</div>

								{/* Categoría */}
								<div>
									<label className={`block text-sm font-medium mb-2 ${
										isDarkMode ? 'text-gray-300' : 'text-gray-700'
									}`}>
										Categoría *
									</label>
									<select
										value={formData.category}
										onChange={(e) => setFormData({...formData, category: e.target.value as ProductCategory})}
										className={`w-full px-3 py-2 rounded-lg border transition-colors ${
											isDarkMode 
												? 'bg-gray-700 border-gray-600 text-white' 
												: 'bg-white border-gray-300 text-gray-900'
										}`}
									>
										{PRODUCT_CATEGORIES.map(category => (
											<option key={category.value} value={category.value}>
												{category.icon} {category.label}
											</option>
										))}
									</select>
								</div>

								{/* Descripción */}
								<div>
									<label className={`block text-sm font-medium mb-2 ${
										isDarkMode ? 'text-gray-300' : 'text-gray-700'
									}`}>
										Descripción
									</label>
									<textarea
										value={formData.description}
										onChange={(e) => setFormData({...formData, description: e.target.value})}
										rows={3}
										className={`w-full px-3 py-2 rounded-lg border transition-colors ${
											isDarkMode 
												? 'bg-gray-700 border-gray-600 text-white' 
												: 'bg-white border-gray-300 text-gray-900'
										}`}
									/>
								</div>

								{/* Cantidad y Unidad */}
								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className={`block text-sm font-medium mb-2 ${
											isDarkMode ? 'text-gray-300' : 'text-gray-700'
										}`}>
											Cantidad *
										</label>
										<input
											type="number"
											required
											min="0"
											step="0.01"
											value={formData.quantity}
											onChange={(e) => setFormData({...formData, quantity: parseFloat(e.target.value) || 0})}
											className={`w-full px-3 py-2 rounded-lg border transition-colors ${
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
											Unidad *
										</label>
										<select
											value={formData.unit}
											onChange={(e) => setFormData({...formData, unit: e.target.value})}
											className={`w-full px-3 py-2 rounded-lg border transition-colors ${
												isDarkMode 
													? 'bg-gray-700 border-gray-600 text-white' 
													: 'bg-white border-gray-300 text-gray-900'
											}`}
										>
											{UNITS.map(unit => (
												<option key={unit} value={unit}>{unit}</option>
											))}
										</select>
									</div>
								</div>

								{/* Stock mínimo y Precio */}
								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className={`block text-sm font-medium mb-2 ${
											isDarkMode ? 'text-gray-300' : 'text-gray-700'
										}`}>
											Stock mínimo *
										</label>
										<input
											type="number"
											required
											min="0"
											step="0.01"
											value={formData.minStock}
											onChange={(e) => setFormData({...formData, minStock: parseFloat(e.target.value) || 0})}
											className={`w-full px-3 py-2 rounded-lg border transition-colors ${
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
											Precio (€) *
										</label>
										<input
											type="number"
											required
											min="0"
											step="0.01"
											value={formData.price}
											onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
											className={`w-full px-3 py-2 rounded-lg border transition-colors ${
												isDarkMode 
													? 'bg-gray-700 border-gray-600 text-white' 
													: 'bg-white border-gray-300 text-gray-900'
											}`}
										/>
									</div>
								</div>

								{/* Proveedor y Ubicación */}
								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className={`block text-sm font-medium mb-2 ${
											isDarkMode ? 'text-gray-300' : 'text-gray-700'
										}`}>
											Proveedor
										</label>
										<input
											type="text"
											value={formData.supplier}
											onChange={(e) => setFormData({...formData, supplier: e.target.value})}
											className={`w-full px-3 py-2 rounded-lg border transition-colors ${
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
											Ubicación
										</label>
										<input
											type="text"
											value={formData.location}
											onChange={(e) => setFormData({...formData, location: e.target.value})}
											className={`w-full px-3 py-2 rounded-lg border transition-colors ${
												isDarkMode 
													? 'bg-gray-700 border-gray-600 text-white' 
													: 'bg-white border-gray-300 text-gray-900'
											}`}
										/>
									</div>
								</div>

								{/* Notas */}
								<div>
									<label className={`block text-sm font-medium mb-2 ${
										isDarkMode ? 'text-gray-300' : 'text-gray-700'
									}`}>
										Notas
									</label>
									<textarea
										value={formData.notes}
										onChange={(e) => setFormData({...formData, notes: e.target.value})}
										rows={2}
										className={`w-full px-3 py-2 rounded-lg border transition-colors ${
											isDarkMode 
												? 'bg-gray-700 border-gray-600 text-white' 
												: 'bg-white border-gray-300 text-gray-900'
										}`}
									/>
								</div>

								{/* Botones */}
								<div className="flex items-center space-x-3 pt-4">
									<button
										type="submit"
										disabled={isLoading}
										className={`flex items-center space-x-2 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-lg transition-colors text-sm font-medium`}
									>
										<Save className="h-4 w-4" />
										<span>{isLoading ? 'Guardando...' : 'Guardar'}</span>
									</button>
									<button
										type="button"
										onClick={resetForm}
										className={`px-4 py-2 border rounded-lg transition-colors text-sm font-medium ${
											isDarkMode 
												? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
												: 'border-gray-300 text-gray-600 hover:bg-gray-50'
										}`}
									>
										Cancelar
									</button>
								</div>
							</form>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

export default InventoryModal 