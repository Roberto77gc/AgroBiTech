import React, { useState, useEffect } from 'react'
import { X, Plus, Edit, Trash2, Building2, Search, Star } from 'lucide-react'
import type { Supplier } from '../types'
import { supplierAPI } from '../services/api'
import { toast } from 'react-toastify'

interface SupplierManagementModalProps {
	isOpen: boolean
	onClose: () => void
	isDarkMode: boolean
}

const SupplierManagementModal: React.FC<SupplierManagementModalProps> = ({
	isOpen,
	onClose,
	isDarkMode
}) => {
	const [suppliers, setSuppliers] = useState<Supplier[]>([])
	const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([])
	const [searchTerm, setSearchTerm] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [showForm, setShowForm] = useState(false)
	const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
	const [formData, setFormData] = useState({
		name: '',
		contactPerson: '',
		phone: '',
		email: '',
		address: '',
		website: '',
		rating: '',
		notes: ''
	})

	// Cargar proveedores al abrir el modal
	useEffect(() => {
		if (isOpen) {
			loadSuppliers()
		}
	}, [isOpen])

	// Filtrar proveedores cuando cambie la búsqueda
	useEffect(() => {
		let filtered = suppliers
		
		if (searchTerm) {
			filtered = filtered.filter(supplier =>
				supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				supplier.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
				supplier.email?.toLowerCase().includes(searchTerm.toLowerCase())
			)
		}
		
		setFilteredSuppliers(filtered)
	}, [suppliers, searchTerm])

	const loadSuppliers = async () => {
		try {
			setIsLoading(true)
			const response = await supplierAPI.getAll()
			if (response.success) {
				setSuppliers(response.suppliers)
			} else {
				toast.error('Error al cargar proveedores')
			}
		} catch (error) {
			console.error('Error loading suppliers:', error)
			toast.error('Error al cargar proveedores')
		} finally {
			setIsLoading(false)
		}
	}

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target
		setFormData(prev => ({
			...prev,
			[name]: value
		}))
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		
		if (!formData.name) {
			toast.error('Por favor ingresa el nombre del proveedor')
			return
		}

		try {
			setIsLoading(true)
			const supplierData = {
				...formData,
				rating: formData.rating ? parseFloat(formData.rating) : undefined,
				active: true
			}

			if (editingSupplier) {
				// Actualizar proveedor existente
				const response = await supplierAPI.update(editingSupplier._id, supplierData)
				if (response.success) {
					toast.success('Proveedor actualizado correctamente')
					await loadSuppliers()
					handleCloseForm()
				} else {
					toast.error('Error al actualizar proveedor')
				}
			} else {
				// Crear nuevo proveedor
				const response = await supplierAPI.create(supplierData)
				if (response.success) {
					toast.success('Proveedor creado correctamente')
					await loadSuppliers()
					handleCloseForm()
				} else {
					toast.error('Error al crear proveedor')
				}
			}
		} catch (error) {
			console.error('Error saving supplier:', error)
			toast.error('Error al guardar proveedor')
		} finally {
			setIsLoading(false)
		}
	}

	const handleEdit = (supplier: Supplier) => {
		setEditingSupplier(supplier)
		setFormData({
			name: supplier.name,
			contactPerson: supplier.contactPerson || '',
			phone: supplier.phone || '',
			email: supplier.email || '',
			address: supplier.address || '',
			website: supplier.website || '',
			rating: supplier.rating?.toString() || '',
			notes: supplier.notes || ''
		})
		setShowForm(true)
	}

	const handleDelete = async (supplierId: string) => {
		if (!window.confirm('¿Estás seguro de que quieres eliminar este proveedor?')) {
			return
		}

		try {
			setIsLoading(true)
			const response = await supplierAPI.delete(supplierId)
			if (response.success) {
				toast.success('Proveedor eliminado correctamente')
				await loadSuppliers()
			} else {
				toast.error('Error al eliminar proveedor')
			}
		} catch (error) {
			console.error('Error deleting supplier:', error)
			toast.error('Error al eliminar proveedor')
		} finally {
			setIsLoading(false)
		}
	}

	const handleCloseForm = () => {
		setShowForm(false)
		setEditingSupplier(null)
		setFormData({
			name: '',
			contactPerson: '',
			phone: '',
			email: '',
			address: '',
			website: '',
			rating: '',
			notes: ''
		})
	}

	const renderRating = (rating?: number) => {
		if (!rating) return null
		
		return (
			<div className="flex items-center space-x-1">
				{[1, 2, 3, 4, 5].map((star) => (
					<Star
						key={star}
						className={`w-4 h-4 ${
							star <= rating 
								? 'text-yellow-400 fill-current' 
								: 'text-gray-300'
						}`}
					/>
				))}
				<span className="text-sm text-gray-500">({rating})</span>
			</div>
		)
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
						<Building2 className="w-6 h-6 text-green-500" />
						<h2 className="text-xl font-semibold">Gestión de Proveedores</h2>
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
								<label className="block text-sm font-medium mb-2">Buscar</label>
								<div className="relative">
									<Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
										isDarkMode ? 'text-gray-400' : 'text-gray-500'
									}`} />
									<input
										type="text"
										placeholder="Buscar proveedores..."
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
								className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors"
							>
								<Plus className="w-4 h-4" />
								<span>Nuevo Proveedor</span>
							</button>
						</div>

						{/* Lista de proveedores */}
						<div className="mt-6 space-y-2">
							{isLoading ? (
								<div className="text-center py-4">
									<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
								</div>
							) : filteredSuppliers.length === 0 ? (
								<div className={`text-center py-8 ${
									isDarkMode ? 'text-gray-400' : 'text-gray-500'
								}`}>
									<Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
									<p>No hay proveedores</p>
								</div>
							) : (
								filteredSuppliers.map((supplier) => (
									<div
										key={supplier._id}
										className={`p-4 rounded-lg border cursor-pointer transition-colors ${
											isDarkMode 
												? 'border-gray-700 hover:bg-gray-800' 
												: 'border-gray-200 hover:bg-gray-50'
										}`}
										onClick={() => handleEdit(supplier)}
									>
										<div className="flex items-center justify-between">
											<div className="flex-1">
												<h3 className="font-medium">{supplier.name}</h3>
												{supplier.contactPerson && (
													<p className={`text-sm ${
														isDarkMode ? 'text-gray-400' : 'text-gray-600'
													}`}>
														{supplier.contactPerson}
													</p>
												)}
												{supplier.email && (
													<p className={`text-sm ${
														isDarkMode ? 'text-gray-400' : 'text-gray-600'
													}`}>
														{supplier.email}
													</p>
												)}
												{renderRating(supplier.rating)}
											</div>
											<div className="flex space-x-2">
												<button
													onClick={(e) => {
														e.stopPropagation()
														handleEdit(supplier)
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
														handleDelete(supplier._id)
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
										{editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
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
												Nombre del Proveedor *
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
												Persona de Contacto
											</label>
											<input
												type="text"
												name="contactPerson"
												value={formData.contactPerson}
												onChange={handleInputChange}
												className={`w-full p-3 rounded-lg border ${
													isDarkMode 
														? 'bg-gray-800 border-gray-600 text-white' 
														: 'bg-white border-gray-300 text-gray-900'
												}`}
											/>
										</div>

										<div>
											<label className="block text-sm font-medium mb-2">
												Teléfono
											</label>
											<input
												type="tel"
												name="phone"
												value={formData.phone}
												onChange={handleInputChange}
												className={`w-full p-3 rounded-lg border ${
													isDarkMode 
														? 'bg-gray-800 border-gray-600 text-white' 
														: 'bg-white border-gray-300 text-gray-900'
												}`}
											/>
										</div>

										<div>
											<label className="block text-sm font-medium mb-2">
												Email
											</label>
											<input
												type="email"
												name="email"
												value={formData.email}
												onChange={handleInputChange}
												className={`w-full p-3 rounded-lg border ${
													isDarkMode 
														? 'bg-gray-800 border-gray-600 text-white' 
														: 'bg-white border-gray-300 text-gray-900'
												}`}
											/>
										</div>

										<div>
											<label className="block text-sm font-medium mb-2">
												Valoración (1-5)
											</label>
											<input
												type="number"
												name="rating"
												value={formData.rating}
												onChange={handleInputChange}
												min="1"
												max="5"
												step="0.1"
												className={`w-full p-3 rounded-lg border ${
													isDarkMode 
														? 'bg-gray-800 border-gray-600 text-white' 
														: 'bg-white border-gray-300 text-gray-900'
												}`}
											/>
										</div>

										<div>
											<label className="block text-sm font-medium mb-2">
												Sitio Web
											</label>
											<input
												type="url"
												name="website"
												value={formData.website}
												onChange={handleInputChange}
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
											Dirección
										</label>
										<input
											type="text"
											name="address"
											value={formData.address}
											onChange={handleInputChange}
											className={`w-full p-3 rounded-lg border ${
												isDarkMode 
													? 'bg-gray-800 border-gray-600 text-white' 
													: 'bg-white border-gray-300 text-gray-900'
											}`}
										/>
									</div>

									<div>
										<label className="block text-sm font-medium mb-2">
											Notas
										</label>
										<textarea
											name="notes"
											value={formData.notes}
											onChange={handleInputChange}
											rows={3}
											placeholder="Notas adicionales sobre el proveedor..."
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
											className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white px-6 py-3 rounded-lg flex items-center space-x-2"
										>
											{isLoading ? (
												<>
													<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
													<span>Guardando...</span>
												</>
											) : (
												<>
													<Plus className="w-4 h-4" />
													<span>{editingSupplier ? 'Actualizar' : 'Crear'} Proveedor</span>
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
								<Building2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
								<p className="text-lg font-medium mb-2">Gestión de Proveedores</p>
								<p>Selecciona un proveedor para editar o crea uno nuevo</p>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

export default SupplierManagementModal 