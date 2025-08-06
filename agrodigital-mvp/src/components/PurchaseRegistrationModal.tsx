import React, { useState, useEffect } from 'react'
import { X, Plus, Edit, Trash2, ShoppingCart, Search, Calendar, DollarSign, Package } from 'lucide-react'
import type { ProductPurchase, ProductPrice, Supplier } from '../types'
import { productAPI, supplierAPI, purchaseAPI } from '../services/api'
import { toast } from 'react-toastify'

interface PurchaseRegistrationModalProps {
	isOpen: boolean
	onClose: () => void
	isDarkMode: boolean
}

const PurchaseRegistrationModal: React.FC<PurchaseRegistrationModalProps> = ({ 
	isOpen, 
	onClose, 
	isDarkMode 
}) => {
	const [purchases, setPurchases] = useState<ProductPurchase[]>([])
	const [filteredPurchases, setFilteredPurchases] = useState<ProductPurchase[]>([])
	const [products, setProducts] = useState<ProductPrice[]>([])
	const [suppliers, setSuppliers] = useState<Supplier[]>([])
	const [searchTerm, setSearchTerm] = useState('')
	const [selectedProductType, setSelectedProductType] = useState<'all' | 'fertilizer' | 'water'>('all')
	const [showAddForm, setShowAddForm] = useState(false)
	const [editingPurchase, setEditingPurchase] = useState<ProductPurchase | null>(null)
	const [isLoading, setIsLoading] = useState(false)
	
	const [formData, setFormData] = useState({
		productId: '',
		productName: '',
		brand: '',
		supplier: '',
		purchaseDate: '',
		pricePerUnit: 0,
		quantity: 0,
		totalCost: 0,
		unit: '',
		notes: ''
	})

	useEffect(() => {
		if (isOpen) {
			loadData()
		}
	}, [isOpen])

	useEffect(() => {
		filterPurchases()
	}, [purchases, searchTerm, selectedProductType])

	useEffect(() => {
		// Calcular costo total cuando cambian precio o cantidad
		if (formData.pricePerUnit > 0 && formData.quantity > 0) {
			setFormData(prev => ({
				...prev,
				totalCost: prev.pricePerUnit * prev.quantity
			}))
		}
	}, [formData.pricePerUnit, formData.quantity])

	const loadData = async () => {
		try {
			setIsLoading(true)
			const [productsResponse, suppliersResponse, purchasesResponse] = await Promise.all([
				productAPI.getAll(),
				supplierAPI.getAll(),
				purchaseAPI.getAll()
			])
			
			if (productsResponse.success) {
				setProducts(productsResponse.products)
			}
			
			if (suppliersResponse.success) {
				setSuppliers(suppliersResponse.suppliers)
			}
			
			if (purchasesResponse.success) {
				setPurchases(purchasesResponse.purchases)
			}
		} catch (error) {
			console.error('Error loading data:', error)
			toast.error('Error al cargar datos')
		} finally {
			setIsLoading(false)
		}
	}

	const filterPurchases = () => {
		let filtered = purchases

		// Filtrar por tipo de producto
		if (selectedProductType !== 'all') {
			filtered = filtered.filter(purchase => {
				const product = products.find(p => p._id === purchase.productId)
				return product?.type === selectedProductType
			})
		}

		// Filtrar por búsqueda
		if (searchTerm) {
			filtered = filtered.filter(purchase => 
				purchase.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
				purchase.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
				purchase.supplier.toLowerCase().includes(searchTerm.toLowerCase())
			)
		}

		setFilteredPurchases(filtered)
	}

	const handleProductChange = (productId: string) => {
		const product = products.find(p => p._id === productId)
		if (product) {
			setFormData({
				...formData,
				productId: product._id,
				productName: product.name,
				unit: product.unit,
				pricePerUnit: product.pricePerUnit
			})
		}
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		
		if (editingPurchase) {
			// Actualizar compra existente
			try {
				await purchaseAPI.update(editingPurchase._id, formData)
				toast.success('Compra actualizada exitosamente')
			} catch (error) {
				console.error('Error updating purchase:', error)
				toast.error('Error al actualizar la compra')
			}
		} else {
			// Añadir nueva compra
			try {
				await purchaseAPI.create(formData)
				toast.success('Compra registrada exitosamente')
			} catch (error) {
				console.error('Error adding purchase:', error)
				toast.error('Error al registrar la compra')
			}
		}
		
		// Limpiar formulario
		setFormData({
			productId: '',
			productName: '',
			brand: '',
			supplier: '',
			purchaseDate: '',
			pricePerUnit: 0,
			quantity: 0,
			totalCost: 0,
			unit: '',
			notes: ''
		})
		
		setEditingPurchase(null)
		setShowAddForm(false)
		loadData()
	}

	const handleEdit = (purchase: ProductPurchase) => {
		setEditingPurchase(purchase)
		setFormData({
			productId: purchase._id,
			productName: purchase.productName,
			brand: purchase.brand,
			supplier: purchase.supplier,
			purchaseDate: purchase.purchaseDate,
			pricePerUnit: purchase.pricePerUnit,
			quantity: purchase.quantity,
			totalCost: purchase.totalCost,
			unit: purchase.unit,
			notes: purchase.notes || ''
		})
		setShowAddForm(true)
	}

	const handleDelete = async (purchaseId: string) => {
		if (window.confirm('¿Estás seguro de que quieres eliminar esta compra?')) {
			try {
				await purchaseAPI.delete(purchaseId)
				toast.success('Compra eliminada exitosamente')
				loadData()
			} catch (error) {
				console.error('Error deleting purchase:', error)
				toast.error('Error al eliminar la compra')
			}
		}
	}

	const handleCancel = () => {
		setFormData({
			productId: '',
			productName: '',
			brand: '',
			supplier: '',
			purchaseDate: '',
			pricePerUnit: 0,
			quantity: 0,
			totalCost: 0,
			unit: '',
			notes: ''
		})
		setEditingPurchase(null)
		setShowAddForm(false)
	}

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('es-ES', {
			style: 'currency',
			currency: 'EUR'
		}).format(amount)
	}

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('es-ES')
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
						<ShoppingCart className="h-6 w-6 text-blue-600" />
						<h2 className="text-xl font-semibold">Registro de Compras</h2>
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
									placeholder="Buscar compras..."
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
								value={selectedProductType}
								onChange={(e) => setSelectedProductType(e.target.value as 'all' | 'fertilizer' | 'water')}
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
								<span>Registrar Compra</span>
							</button>
						</div>
					</div>

					{/* Formulario de añadir/editar */}
					{showAddForm && (
						<div className={`p-4 rounded-lg border ${
							isDarkMode ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-50'
						}`}>
							<h3 className="text-lg font-medium mb-4">
								{editingPurchase ? 'Editar Compra' : 'Registrar Nueva Compra'}
							</h3>
							<form onSubmit={handleSubmit} className="space-y-4">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<label className={`block text-sm font-medium mb-2 ${
											isDarkMode ? 'text-gray-300' : 'text-gray-700'
										}`}>
											Producto *
										</label>
										<select
											required
											value={formData.productId}
											onChange={(e) => handleProductChange(e.target.value)}
											className={`w-full px-3 py-2 border rounded-lg transition-colors ${
												isDarkMode 
													? 'bg-gray-600 border-gray-500 text-white' 
													: 'bg-white border-gray-300 text-gray-900'
											}`}
										>
											<option value="">Seleccionar producto...</option>
											{products.map((product) => (
												<option key={product._id} value={product._id}>
													{product.name} ({product.type === 'fertilizer' ? 'Fertilizante' : 'Agua'})
												</option>
											))}
										</select>
									</div>
									
									<div>
										<label className={`block text-sm font-medium mb-2 ${
											isDarkMode ? 'text-gray-300' : 'text-gray-700'
										}`}>
											Marca *
										</label>
										<input
											type="text"
											required
											value={formData.brand}
											onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
											className={`w-full px-3 py-2 border rounded-lg transition-colors ${
												isDarkMode 
													? 'bg-gray-600 border-gray-500 text-white' 
													: 'bg-white border-gray-300 text-gray-900'
											}`}
											placeholder="Ej: Fertiberia"
										/>
									</div>
									
									<div>
										<label className={`block text-sm font-medium mb-2 ${
											isDarkMode ? 'text-gray-300' : 'text-gray-700'
										}`}>
											Proveedor *
										</label>
										<select
											required
											value={formData.supplier}
											onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
											className={`w-full px-3 py-2 border rounded-lg transition-colors ${
												isDarkMode 
													? 'bg-gray-600 border-gray-500 text-white' 
													: 'bg-white border-gray-300 text-gray-900'
											}`}
										>
											<option value="">Seleccionar proveedor...</option>
											{suppliers.map((supplier) => (
												<option key={supplier._id} value={supplier.name}>
													{supplier.name}
												</option>
											))}
										</select>
									</div>
									
									<div>
										<label className={`block text-sm font-medium mb-2 ${
											isDarkMode ? 'text-gray-300' : 'text-gray-700'
										}`}>
											Fecha de Compra *
										</label>
										<input
											type="date"
											required
											value={formData.purchaseDate}
											onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
											className={`w-full px-3 py-2 border rounded-lg transition-colors ${
												isDarkMode 
													? 'bg-gray-600 border-gray-500 text-white' 
													: 'bg-white border-gray-300 text-gray-900'
											}`}
										/>
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
												onFocus={(e) => {
													if (e.target.value === '0') {
														e.target.value = ''
													}
												}}
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
											Cantidad *
										</label>
										<div className="flex items-center space-x-2">
											<input
												type="number"
												required
												step="0.01"
												min="0"
												value={formData.quantity}
												onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
												onFocus={(e) => {
													if (e.target.value === '0') {
														e.target.value = ''
													}
												}}
												className={`flex-1 px-3 py-2 border rounded-lg transition-colors ${
													isDarkMode 
														? 'bg-gray-600 border-gray-500 text-white' 
														: 'bg-white border-gray-300 text-gray-900'
												}`}
												placeholder="0"
											/>
											<span className={`text-sm font-medium ${
												isDarkMode ? 'text-gray-300' : 'text-gray-700'
											}`}>
												{formData.unit}
											</span>
										</div>
									</div>
									
									<div>
										<label className={`block text-sm font-medium mb-2 ${
											isDarkMode ? 'text-gray-300' : 'text-gray-700'
										}`}>
											Costo Total
										</label>
										<div className="flex items-center space-x-2">
											<DollarSign className="h-4 w-4 text-green-600" />
											<span className="text-lg font-semibold text-green-600">
												{formatCurrency(formData.totalCost)}
											</span>
										</div>
									</div>
								</div>
								
								<div>
									<label className={`block text-sm font-medium mb-2 ${
										isDarkMode ? 'text-gray-300' : 'text-gray-700'
									}`}>
										Notas
									</label>
									<textarea
										value={formData.notes}
										onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
										rows={3}
										className={`w-full px-3 py-2 border rounded-lg transition-colors ${
											isDarkMode 
												? 'bg-gray-600 border-gray-500 text-white' 
												: 'bg-white border-gray-300 text-gray-900'
										}`}
										placeholder="Notas sobre la compra..."
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
										{editingPurchase ? 'Actualizar' : 'Registrar'} Compra
									</button>
								</div>
							</form>
						</div>
					)}

					{/* Lista de compras */}
					<div className={`p-4 rounded-lg border ${
						isDarkMode ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-50'
					}`}>
						<h3 className="text-lg font-medium mb-4">
							Historial de Compras ({filteredPurchases.length})
						</h3>
						
						{isLoading ? (
							<div className="text-center py-8">
								<p className={`text-lg ${
									isDarkMode ? 'text-gray-400' : 'text-gray-500'
								}`}>Cargando compras...</p>
							</div>
						) : filteredPurchases.length === 0 ? (
							<div className="text-center py-8">
								<ShoppingCart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
								<p className={`text-lg ${
									isDarkMode ? 'text-gray-400' : 'text-gray-500'
								}`}>
									{searchTerm || selectedProductType !== 'all' 
										? 'No se encontraron compras con los filtros aplicados'
										: 'No hay compras registradas. Registra tu primera compra.'
									}
								</p>
								{!searchTerm && selectedProductType === 'all' && (
									<button
										onClick={() => setShowAddForm(true)}
										className="mt-4 flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors mx-auto"
									>
										<Plus className="h-4 w-4" />
										<span>Registrar Primera Compra</span>
									</button>
								)}
							</div>
						) : (
							<div className="space-y-3">
								{filteredPurchases.map((purchase) => (
									<div key={purchase._id} className={`p-4 rounded-lg border ${
										isDarkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-white'
									}`}>
										<div className="flex items-start justify-between">
											<div className="flex-1">
												<div className="flex items-center space-x-3 mb-2">
													<div className="p-2 rounded-lg bg-blue-100 text-blue-600">
														<Package className="h-4 w-4" />
													</div>
													<div>
														<h4 className="font-medium">{purchase.productName}</h4>
														<p className="text-sm text-gray-500">
															Marca: {purchase.brand} | Proveedor: {purchase.supplier}
														</p>
													</div>
												</div>
												
												<div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
													<div className="flex items-center space-x-2">
														<Calendar className="h-3 w-3 text-gray-400" />
														<span>{formatDate(purchase.purchaseDate)}</span>
													</div>
													<div className="flex items-center space-x-2">
														<span className="text-gray-500">Cantidad:</span>
														<span className="font-medium">
															{purchase.quantity} {purchase.unit}
														</span>
													</div>
													<div className="flex items-center space-x-2">
														<span className="text-gray-500">Precio:</span>
														<span className="font-medium">
															{formatCurrency(purchase.pricePerUnit)}/{purchase.unit}
														</span>
													</div>
												</div>
												
												<div className="flex items-center space-x-2 mt-2">
													<DollarSign className="h-4 w-4 text-green-600" />
													<span className="text-lg font-semibold text-green-600">
														{formatCurrency(purchase.totalCost)}
													</span>
												</div>
												
												{purchase.notes && (
													<p className="text-sm text-gray-500 mt-2">{purchase.notes}</p>
												)}
											</div>
											
											<div className="flex items-center space-x-2 ml-4">
												<button
													onClick={() => handleEdit(purchase)}
													className={`p-2 rounded-lg transition-colors ${
														isDarkMode 
															? 'hover:bg-gray-600 text-gray-400 hover:text-white' 
															: 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
													}`}
												>
													<Edit className="h-4 w-4" />
												</button>
												<button
													onClick={() => handleDelete(purchase._id)}
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

export default PurchaseRegistrationModal 