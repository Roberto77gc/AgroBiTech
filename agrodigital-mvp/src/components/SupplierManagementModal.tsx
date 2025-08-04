import React, { useState, useEffect } from 'react'
import { X, Plus, Edit, Trash2, Users, Search, Star, Phone, Mail, MapPin, Globe } from 'lucide-react'
import { 
	getAllSuppliers, 
	addSupplier, 
	updateSupplier, 
	deleteSupplier, 
	type Supplier 
} from '../data/productPrices'

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
	const [showAddForm, setShowAddForm] = useState(false)
	const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
	
	const [formData, setFormData] = useState({
		name: '',
		contactPerson: '',
		phone: '',
		email: '',
		address: '',
		website: '',
		rating: 0,
		notes: '',
		active: true
	})

	useEffect(() => {
		if (isOpen) {
			loadSuppliers()
		}
	}, [isOpen])

	useEffect(() => {
		filterSuppliers()
	}, [suppliers, searchTerm])

	const loadSuppliers = () => {
		const allSuppliers = getAllSuppliers()
		setSuppliers(allSuppliers)
	}

	const filterSuppliers = () => {
		let filtered = suppliers

		// Filtrar por búsqueda
		if (searchTerm) {
			filtered = filtered.filter(supplier => 
				supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				supplier.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
				supplier.email?.toLowerCase().includes(searchTerm.toLowerCase())
			)
		}

		setFilteredSuppliers(filtered)
	}

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		
		if (editingSupplier) {
			// Actualizar proveedor existente
			updateSupplier(editingSupplier.id, formData)
		} else {
			// Añadir nuevo proveedor
			addSupplier(formData)
		}
		
		// Limpiar formulario
		setFormData({
			name: '',
			contactPerson: '',
			phone: '',
			email: '',
			address: '',
			website: '',
			rating: 0,
			notes: '',
			active: true
		})
		
		setEditingSupplier(null)
		setShowAddForm(false)
		loadSuppliers()
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
			rating: supplier.rating || 0,
			notes: supplier.notes || '',
			active: supplier.active
		})
		setShowAddForm(true)
	}

	const handleDelete = (supplierId: string) => {
		if (window.confirm('¿Estás seguro de que quieres eliminar este proveedor?')) {
			deleteSupplier(supplierId)
			loadSuppliers()
		}
	}

	const handleCancel = () => {
		setFormData({
			name: '',
			contactPerson: '',
			phone: '',
			email: '',
			address: '',
			website: '',
			rating: 0,
			notes: '',
			active: true
		})
		setEditingSupplier(null)
		setShowAddForm(false)
	}

	const renderStars = (rating: number) => {
		return Array.from({ length: 5 }, (_, i) => (
			<Star
				key={i}
				className={`h-4 w-4 ${
					i < rating 
						? 'text-yellow-400 fill-current' 
						: 'text-gray-300'
				}`}
			/>
		))
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
						<Users className="h-6 w-6 text-blue-600" />
						<h2 className="text-xl font-semibold">Gestión de Proveedores</h2>
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
									placeholder="Buscar proveedores..."
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
						<button
							onClick={() => setShowAddForm(true)}
							className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
						>
							<Plus className="h-4 w-4" />
							<span>Añadir Proveedor</span>
						</button>
					</div>

					{/* Formulario de añadir/editar */}
					{showAddForm && (
						<div className={`p-4 rounded-lg border ${
							isDarkMode ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-50'
						}`}>
							<h3 className="text-lg font-medium mb-4">
								{editingSupplier ? 'Editar Proveedor' : 'Añadir Nuevo Proveedor'}
							</h3>
							<form onSubmit={handleSubmit} className="space-y-4">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<label className={`block text-sm font-medium mb-2 ${
											isDarkMode ? 'text-gray-300' : 'text-gray-700'
										}`}>
											Nombre de la Empresa *
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
											placeholder="Ej: Agro Ibérica"
										/>
									</div>
									
									<div>
										<label className={`block text-sm font-medium mb-2 ${
											isDarkMode ? 'text-gray-300' : 'text-gray-700'
										}`}>
											Persona de Contacto
										</label>
										<input
											type="text"
											value={formData.contactPerson}
											onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
											className={`w-full px-3 py-2 border rounded-lg transition-colors ${
												isDarkMode 
													? 'bg-gray-600 border-gray-500 text-white' 
													: 'bg-white border-gray-300 text-gray-900'
											}`}
											placeholder="Ej: María García"
										/>
									</div>
									
									<div>
										<label className={`block text-sm font-medium mb-2 ${
											isDarkMode ? 'text-gray-300' : 'text-gray-700'
										}`}>
											Teléfono
										</label>
										<div className="relative">
											<Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
											<input
												type="tel"
												value={formData.phone}
												onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
												className={`w-full pl-10 pr-3 py-2 border rounded-lg transition-colors ${
													isDarkMode 
														? 'bg-gray-600 border-gray-500 text-white' 
														: 'bg-white border-gray-300 text-gray-900'
												}`}
												placeholder="+34 955 123 456"
											/>
										</div>
									</div>
									
									<div>
										<label className={`block text-sm font-medium mb-2 ${
											isDarkMode ? 'text-gray-300' : 'text-gray-700'
										}`}>
											Email
										</label>
										<div className="relative">
											<Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
											<input
												type="email"
												value={formData.email}
												onChange={(e) => setFormData({ ...formData, email: e.target.value })}
												className={`w-full pl-10 pr-3 py-2 border rounded-lg transition-colors ${
													isDarkMode 
														? 'bg-gray-600 border-gray-500 text-white' 
														: 'bg-white border-gray-300 text-gray-900'
												}`}
												placeholder="info@empresa.es"
											/>
										</div>
									</div>
									
									<div className="md:col-span-2">
										<label className={`block text-sm font-medium mb-2 ${
											isDarkMode ? 'text-gray-300' : 'text-gray-700'
										}`}>
											Dirección
										</label>
										<div className="relative">
											<MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
											<input
												type="text"
												value={formData.address}
												onChange={(e) => setFormData({ ...formData, address: e.target.value })}
												className={`w-full pl-10 pr-3 py-2 border rounded-lg transition-colors ${
													isDarkMode 
														? 'bg-gray-600 border-gray-500 text-white' 
														: 'bg-white border-gray-300 text-gray-900'
												}`}
												placeholder="Calle Agricultura 15, Sevilla"
											/>
										</div>
									</div>
									
									<div>
										<label className={`block text-sm font-medium mb-2 ${
											isDarkMode ? 'text-gray-300' : 'text-gray-700'
										}`}>
											Sitio Web
										</label>
										<div className="relative">
											<Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
											<input
												type="url"
												value={formData.website}
												onChange={(e) => setFormData({ ...formData, website: e.target.value })}
												className={`w-full pl-10 pr-3 py-2 border rounded-lg transition-colors ${
													isDarkMode 
														? 'bg-gray-600 border-gray-500 text-white' 
														: 'bg-white border-gray-300 text-gray-900'
												}`}
												placeholder="www.empresa.es"
											/>
										</div>
									</div>
									
									<div>
										<label className={`block text-sm font-medium mb-2 ${
											isDarkMode ? 'text-gray-300' : 'text-gray-700'
										}`}>
											Valoración (1-5 estrellas)
										</label>
										<div className="flex items-center space-x-2">
											{Array.from({ length: 5 }, (_, i) => (
												<button
													key={i}
													type="button"
													onClick={() => setFormData({ ...formData, rating: i + 1 })}
													className="focus:outline-none"
												>
													<Star
														className={`h-6 w-6 ${
															i < formData.rating 
																? 'text-yellow-400 fill-current' 
																: 'text-gray-300'
														}`}
													/>
												</button>
											))}
											<span className="text-sm text-gray-500 ml-2">
												({formData.rating}/5)
											</span>
										</div>
									</div>
									
									<div className="md:col-span-2">
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
										placeholder="Notas sobre el proveedor, experiencia, etc..."
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
										{editingSupplier ? 'Actualizar' : 'Añadir'} Proveedor
									</button>
								</div>
							</form>
						</div>
					)}

					{/* Lista de proveedores */}
					<div className={`p-4 rounded-lg border ${
						isDarkMode ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-50'
					}`}>
						<h3 className="text-lg font-medium mb-4">
							Proveedores ({filteredSuppliers.length})
						</h3>
						
						{filteredSuppliers.length === 0 ? (
							<div className="text-center py-8">
								<Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
								<p className={`text-lg ${
									isDarkMode ? 'text-gray-400' : 'text-gray-500'
								}`}>
									{searchTerm 
										? 'No se encontraron proveedores con la búsqueda aplicada'
										: 'No hay proveedores registrados. Añade tu primer proveedor.'
									}
								</p>
								{!searchTerm && (
									<button
										onClick={() => setShowAddForm(true)}
										className="mt-4 flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors mx-auto"
									>
										<Plus className="h-4 w-4" />
										<span>Añadir Primer Proveedor</span>
									</button>
								)}
							</div>
						) : (
							<div className="space-y-3">
								{filteredSuppliers.map((supplier) => (
									<div key={supplier.id} className={`p-4 rounded-lg border ${
										isDarkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-white'
									}`}>
										<div className="flex items-start justify-between">
											<div className="flex-1">
												<div className="flex items-center space-x-3 mb-2">
													<div className={`p-2 rounded-lg ${
														supplier.active 
															? 'bg-green-100 text-green-600' 
															: 'bg-gray-100 text-gray-600'
													}`}>
														<Users className="h-4 w-4" />
													</div>
													<div>
														<h4 className="font-medium">{supplier.name}</h4>
														{supplier.contactPerson && (
															<p className="text-sm text-gray-500">
																Contacto: {supplier.contactPerson}
															</p>
														)}
													</div>
												</div>
												
												<div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
													{supplier.phone && (
														<div className="flex items-center space-x-2">
															<Phone className="h-3 w-3 text-gray-400" />
															<span>{supplier.phone}</span>
														</div>
													)}
													{supplier.email && (
														<div className="flex items-center space-x-2">
															<Mail className="h-3 w-3 text-gray-400" />
															<span>{supplier.email}</span>
														</div>
													)}
													{supplier.address && (
														<div className="flex items-center space-x-2">
															<MapPin className="h-3 w-3 text-gray-400" />
															<span>{supplier.address}</span>
														</div>
													)}
													{supplier.website && (
														<div className="flex items-center space-x-2">
															<Globe className="h-3 w-3 text-gray-400" />
															<span>{supplier.website}</span>
														</div>
													)}
												</div>
												
												{supplier.rating && supplier.rating > 0 && (
													<div className="flex items-center space-x-2 mt-2">
														<div className="flex">
															{renderStars(supplier.rating)}
														</div>
														<span className="text-sm text-gray-500">
															({supplier.rating}/5)
														</span>
													</div>
												)}
												
												{supplier.notes && (
													<p className="text-sm text-gray-500 mt-2">{supplier.notes}</p>
												)}
											</div>
											
											<div className="flex items-center space-x-2 ml-4">
												<button
													onClick={() => handleEdit(supplier)}
													className={`p-2 rounded-lg transition-colors ${
														isDarkMode 
															? 'hover:bg-gray-600 text-gray-400 hover:text-white' 
															: 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
													}`}
												>
													<Edit className="h-4 w-4" />
												</button>
												<button
													onClick={() => handleDelete(supplier.id)}
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

export default SupplierManagementModal 