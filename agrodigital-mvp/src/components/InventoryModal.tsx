import React, { useState, useEffect } from 'react'
import { X, Plus, Edit, Trash2, Package, Search, AlertTriangle, AlertCircle, Clock, MapPin } from 'lucide-react'
import type { InventoryItem, InventoryAlert } from '../types'
import { inventoryAPI } from '../services/api'
import { toast } from 'react-toastify'

interface InventoryModalProps {
	isOpen: boolean
	onClose: () => void
	isDarkMode: boolean
}

const InventoryModal: React.FC<InventoryModalProps> = ({
	isOpen,
	onClose,
	isDarkMode
}) => {
	const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
	const [alerts, setAlerts] = useState<InventoryAlert[]>([])
	const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([])
	const [selectedType, setSelectedType] = useState<'fertilizer' | 'water' | 'phytosanitary'>('fertilizer')
	const [searchTerm, setSearchTerm] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [showForm, setShowForm] = useState(false)
	const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
	const [formData, setFormData] = useState({
		productId: '',
		productName: '',
		productType: 'fertilizer' as 'fertilizer' | 'water' | 'phytosanitary',
		currentStock: '',
		minStock: '',
		criticalStock: '',
		unit: '',
		location: '',
		expiryDate: ''
	})

	// Cargar datos al abrir el modal
	useEffect(() => {
		if (isOpen) {
			loadInventoryData()
		}
	}, [isOpen])

	// Filtrar items cuando cambie el tipo o búsqueda
	useEffect(() => {
		let filtered = inventoryItems.filter(item => item.productType === selectedType)
		
		if (searchTerm) {
			filtered = filtered.filter(item =>
				item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
				item.location.toLowerCase().includes(searchTerm.toLowerCase())
			)
		}
		
		setFilteredItems(filtered)
	}, [inventoryItems, selectedType, searchTerm])

	const loadInventoryData = async () => {
		try {
			setIsLoading(true)
			const [itemsResponse, alertsResponse] = await Promise.all([
				inventoryAPI.getAll(),
				inventoryAPI.getAlerts()
			])
			
			if (itemsResponse.success) {
				setInventoryItems(itemsResponse.items)
			}
			
			if (alertsResponse.success) {
				setAlerts(alertsResponse.alerts)
			}
		} catch (error) {
			console.error('Error loading inventory data:', error)
			toast.error('Error al cargar datos de inventario')
		} finally {
			setIsLoading(false)
		}
	}

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = e.target
		setFormData(prev => ({
			...prev,
			[name]: value
		}))
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		
		if (!formData.productName || !formData.currentStock || !formData.minStock || !formData.criticalStock || !formData.unit || !formData.location) {
			toast.error('Por favor completa todos los campos obligatorios')
			return
		}

		try {
			setIsLoading(true)
			const itemData = {
				...formData,
				currentStock: parseFloat(formData.currentStock),
				minStock: parseFloat(formData.minStock),
				criticalStock: parseFloat(formData.criticalStock),
				active: true
			}

			if (editingItem) {
				// Actualizar item existente
				const response = await inventoryAPI.update(editingItem._id, itemData)
				if (response.success) {
					toast.success('Item de inventario actualizado correctamente')
					await loadInventoryData()
					handleCloseForm()
				} else {
					toast.error('Error al actualizar item de inventario')
				}
			} else {
				// Crear nuevo item
				const response = await inventoryAPI.create(itemData)
				if (response.success) {
					toast.success('Item de inventario creado correctamente')
					await loadInventoryData()
					handleCloseForm()
				} else {
					toast.error('Error al crear item de inventario')
				}
			}
		} catch (error) {
			console.error('Error saving inventory item:', error)
			toast.error('Error al guardar item de inventario')
		} finally {
			setIsLoading(false)
		}
	}

	const handleEdit = (item: InventoryItem) => {
		setEditingItem(item)
		setFormData({
			productId: item.productId,
			productName: item.productName,
			productType: item.productType,
			currentStock: item.currentStock.toString(),
			minStock: item.minStock.toString(),
			criticalStock: item.criticalStock.toString(),
			unit: item.unit,
			location: item.location,
			expiryDate: item.expiryDate || ''
		})
		setShowForm(true)
	}

	const handleDelete = async (itemId: string) => {
		if (!window.confirm('¿Estás seguro de que quieres eliminar este item del inventario?')) {
			return
		}

		try {
			setIsLoading(true)
			const response = await inventoryAPI.delete(itemId)
			if (response.success) {
				toast.success('Item de inventario eliminado correctamente')
				await loadInventoryData()
			} else {
				toast.error('Error al eliminar item de inventario')
			}
		} catch (error) {
			console.error('Error deleting inventory item:', error)
			toast.error('Error al eliminar item de inventario')
		} finally {
			setIsLoading(false)
		}
	}

	const handleCloseForm = () => {
		setShowForm(false)
		setEditingItem(null)
		setFormData({
			productId: '',
			productName: '',
			productType: 'fertilizer',
			currentStock: '',
			minStock: '',
			criticalStock: '',
			unit: '',
			location: '',
			expiryDate: ''
		})
	}

	const handleMarkAlertAsRead = async (alertId: string) => {
		try {
			const response = await inventoryAPI.markAlertAsRead(alertId)
			if (response.success) {
				await loadInventoryData()
			}
		} catch (error) {
			console.error('Error marking alert as read:', error)
		}
	}

	const getStockStatus = (item: InventoryItem) => {
		if (item.currentStock <= item.criticalStock) {
			return { status: 'critical', icon: AlertTriangle, color: 'text-red-500' }
		} else if (item.currentStock <= item.minStock) {
			return { status: 'warning', icon: AlertCircle, color: 'text-yellow-500' }
		} else {
			return { status: 'normal', icon: Package, color: 'text-green-500' }
		}
	}



	if (!isOpen) return null

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div className={`relative w-full max-w-7xl max-h-[90vh] overflow-hidden rounded-lg shadow-xl ${
				isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
			}`}>
				{/* Header */}
				<div className={`flex items-center justify-between p-6 border-b ${
					isDarkMode ? 'border-gray-700' : 'border-gray-200'
				}`}>
					<div className="flex items-center space-x-3">
						<Package className="w-6 h-6 text-purple-500" />
						<h2 className="text-xl font-semibold">Gestión de Inventario</h2>
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
								className="w-full bg-purple-500 hover:bg-purple-600 text-white py-3 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors"
							>
								<Plus className="w-4 h-4" />
								<span>Nuevo Item</span>
							</button>
						</div>

						{/* Lista de items */}
						<div className="mt-6 space-y-2">
							{isLoading ? (
								<div className="text-center py-4">
									<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
								</div>
							) : filteredItems.length === 0 ? (
								<div className={`text-center py-8 ${
									isDarkMode ? 'text-gray-400' : 'text-gray-500'
								}`}>
									<Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
									<p>No hay items en inventario</p>
								</div>
							) : (
								filteredItems.map((item) => {
									const stockStatus = getStockStatus(item)
									const StatusIcon = stockStatus.icon
									
									return (
										<div
											key={item._id}
											className={`p-4 rounded-lg border cursor-pointer transition-colors ${
												isDarkMode 
													? 'border-gray-700 hover:bg-gray-800' 
													: 'border-gray-200 hover:bg-gray-50'
											}`}
											onClick={() => handleEdit(item)}
										>
											<div className="flex items-center justify-between">
												<div className="flex-1">
													<div className="flex items-center space-x-2">
														<StatusIcon className={`w-4 h-4 ${stockStatus.color}`} />
														<h3 className="font-medium">{item.productName}</h3>
													</div>
													<p className={`text-sm ${
														isDarkMode ? 'text-gray-400' : 'text-gray-600'
													}`}>
														{item.currentStock} {item.unit}
													</p>
													<div className="flex items-center space-x-2 mt-1">
														<MapPin className="w-3 h-3 text-gray-400" />
														<span className={`text-xs ${
															isDarkMode ? 'text-gray-400' : 'text-gray-500'
														}`}>
															{item.location}
														</span>
													</div>
													{item.expiryDate && (
														<div className="flex items-center space-x-2 mt-1">
															<Clock className="w-3 h-3 text-gray-400" />
															<span className={`text-xs ${
																isDarkMode ? 'text-gray-400' : 'text-gray-500'
															}`}>
																Caduca: {item.expiryDate}
															</span>
														</div>
													)}
												</div>
												<div className="flex space-x-2">
													<button
														onClick={(e) => {
															e.stopPropagation()
															handleEdit(item)
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
															handleDelete(item._id)
														}}
														className="p-2 rounded hover:bg-red-100 text-red-500"
													>
														<Trash2 className="w-4 h-4" />
													</button>
												</div>
											</div>
										</div>
									)
								})
							)}
						</div>
					</div>

					{/* Contenido principal */}
					<div className="flex-1 flex flex-col">
						{/* Alertas */}
						{alerts.length > 0 && (
							<div className={`p-4 border-b ${
								isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-yellow-50'
							}`}>
								<h3 className="font-semibold mb-3 flex items-center space-x-2">
									<AlertTriangle className="w-5 h-5 text-yellow-500" />
									<span>Alertas de Inventario</span>
								</h3>
								<div className="space-y-2">
									{alerts.map((alert) => (
										<div
											key={alert._id}
											className={`p-3 rounded-lg border ${
												alert.severity === 'critical'
													? 'border-red-200 bg-red-50'
													: 'border-yellow-200 bg-yellow-50'
											} ${isDarkMode ? 'text-gray-900' : ''}`}
										>
											<div className="flex items-center justify-between">
												<div className="flex-1">
													<p className="font-medium">{alert.productName}</p>
													<p className="text-sm text-gray-600">{alert.message}</p>
												</div>
												<button
													onClick={() => handleMarkAlertAsRead(alert._id)}
													className="text-xs text-blue-500 hover:text-blue-700"
												>
													Marcar como leída
												</button>
											</div>
										</div>
									))}
								</div>
							</div>
						)}

						{/* Formulario o vista previa */}
						{showForm ? (
							<div className="flex-1 p-6 overflow-y-auto">
								<div className="max-w-2xl mx-auto">
									<div className="flex items-center justify-between mb-6">
										<h3 className="text-lg font-semibold">
											{editingItem ? 'Editar Item de Inventario' : 'Nuevo Item de Inventario'}
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
													name="productName"
													value={formData.productName}
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
													name="productType"
													value={formData.productType}
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
													Stock Actual *
												</label>
												<input
													type="number"
													name="currentStock"
													value={formData.currentStock}
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
													Stock Mínimo *
												</label>
												<input
													type="number"
													name="minStock"
													value={formData.minStock}
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
													Stock Crítico *
												</label>
												<input
													type="number"
													name="criticalStock"
													value={formData.criticalStock}
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
													Ubicación *
												</label>
												<input
													type="text"
													name="location"
													value={formData.location}
													onChange={handleInputChange}
													placeholder="Almacén, Estante, etc."
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
													Fecha de Caducidad
												</label>
												<input
													type="date"
													name="expiryDate"
													value={formData.expiryDate}
													onChange={handleInputChange}
													className={`w-full p-3 rounded-lg border ${
														isDarkMode 
															? 'bg-gray-800 border-gray-600 text-white' 
															: 'bg-white border-gray-300 text-gray-900'
													}`}
												/>
											</div>
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
												className="bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white px-6 py-3 rounded-lg flex items-center space-x-2"
											>
												{isLoading ? (
													<>
														<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
														<span>Guardando...</span>
													</>
												) : (
													<>
														<Plus className="w-4 h-4" />
														<span>{editingItem ? 'Actualizar' : 'Crear'} Item</span>
													</>
												)}
											</button>
										</div>
									</form>
								</div>
							</div>
						) : (
							<div className="flex-1 p-6 flex items-center justify-center">
								<div className={`text-center ${
									isDarkMode ? 'text-gray-400' : 'text-gray-500'
								}`}>
									<Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
									<p className="text-lg font-medium mb-2">Gestión de Inventario</p>
									<p>Selecciona un item para editar o crea uno nuevo</p>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}

export default InventoryModal 