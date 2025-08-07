import React, { useState } from 'react'
import { X, Calendar, MapPin, Cloud, FileText, DollarSign, Tag, Leaf, Shield, Droplets, Package, Plus, Edit, Trash2 } from 'lucide-react'
import type { Activity, DailyFertigationRecord } from '../types'
import FertigationDayModal from './FertigationDayModal'
import PhytosanitaryDayModal from './PhytosanitaryDayModal'
import WaterDayModal from './WaterDayModal'

interface ActivityDetailModalProps {
	isOpen: boolean
	onClose: () => void
	activity: Activity
	isDarkMode: boolean
}

const ActivityDetailModal: React.FC<ActivityDetailModalProps> = ({ 
	isOpen, 
	onClose, 
	activity, 
	isDarkMode 
}) => {
	const [showFertigationDayModal, setShowFertigationDayModal] = useState(false)
	const [selectedDay, setSelectedDay] = useState<DailyFertigationRecord | undefined>(undefined)
	const [showPhytosanitaryDayModal, setShowPhytosanitaryDayModal] = useState(false)
	const [showWaterDayModal, setShowWaterDayModal] = useState(false)
	const getCropTypeColor = (cropType: string) => {
		const colors: { [key: string]: string } = {
			tomate: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
			pimiento: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
			pepino: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
			berenjena: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
			lechuga: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
			zanahoria: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
			patata: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
			cebolla: 'bg-white text-gray-800 dark:bg-gray-900 dark:text-gray-200',
			ajo: 'bg-white text-gray-800 dark:bg-gray-900 dark:text-gray-200',
			fresa: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
			uva: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
			olivo: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
			almendro: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
			cereales: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
			legumbres: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
			otro: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200'
		}
		return colors[cropType] || colors.otro
	}

	const formatDate = (date: Date | string) => {
		const dateObj = typeof date === 'string' ? new Date(date) : date
		return dateObj.toLocaleDateString('es-ES', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			weekday: 'long'
		})
	}

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('es-ES', {
			style: 'currency',
			currency: 'EUR'
		}).format(amount)
	}

	const handleAddFertigationDay = () => {
		setSelectedDay(undefined)
		setShowFertigationDayModal(true)
	}

	const handleEditFertigationDay = (day: DailyFertigationRecord) => {
		setSelectedDay(day)
		setShowFertigationDayModal(true)
	}

	const handleDeleteFertigationDay = (index: number) => {
		if (confirm('¿Estás seguro de que quieres eliminar este día de fertirriego?')) {
			// Aquí implementarías la lógica para eliminar el día
			console.log('Eliminar día:', index)
		}
	}

	const handleFertigationDaySubmit = async (dayData: DailyFertigationRecord) => {
		try {
			// Aquí implementarías la lógica para guardar/actualizar el día
			console.log('Guardar día:', dayData)
			
			// Por ahora, solo cerramos el modal
			setShowFertigationDayModal(false)
			setSelectedDay(undefined)
		} catch (error) {
			console.error('Error saving fertigation day:', error)
		}
	}

	const handleAddPhytosanitaryDay = () => {
		setShowPhytosanitaryDayModal(true)
	}

	const handleAddWaterDay = () => {
		setShowWaterDayModal(true)
	}

	const handlePhytosanitaryDaySubmit = async (dayData: any) => {
		try {
			console.log('Guardar día de fitosanitarios:', dayData)
			setShowPhytosanitaryDayModal(false)
		} catch (error) {
			console.error('Error saving phytosanitary day:', error)
		}
	}

	const handleWaterDaySubmit = async (dayData: any) => {
		try {
			console.log('Guardar día de agua:', dayData)
			setShowWaterDayModal(false)
		} catch (error) {
			console.error('Error saving water day:', error)
		}
	}

	if (!isOpen) return null

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			{/* Overlay */}
			<div 
				className="absolute inset-0 bg-black bg-opacity-50"
				onClick={onClose}
			/>
			
			{/* Modal */}
			<div className={`relative w-full max-w-4xl mx-4 rounded-xl shadow-2xl transition-colors ${
				isDarkMode ? 'bg-gray-800' : 'bg-white'
			}`}>
				{/* Header */}
				<div className={`flex items-center justify-between p-6 border-b ${
					isDarkMode ? 'border-gray-700' : 'border-gray-200'
				}`}>
					<div className="flex items-center space-x-3">
						<span className={`px-3 py-1 text-sm font-medium rounded-full ${getCropTypeColor(activity.cropType)}`}>
							{activity.cropType.charAt(0).toUpperCase() + activity.cropType.slice(1)}
						</span>
						<h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
							{activity.name}
						</h2>
					</div>
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
				<div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
					{/* Información Básica */}
					<div>
						<h3 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
							Información Básica
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="flex items-center space-x-3">
								<div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
									<Tag className="h-5 w-5 text-blue-500" />
								</div>
								<div>
									<p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
										Tipo de Cultivo
									</p>
									<p className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
										{activity.cropType.charAt(0).toUpperCase() + activity.cropType.slice(1)}
									</p>
								</div>
							</div>

							{activity.plantCount && activity.plantCount > 0 && (
								<div className="flex items-center space-x-3">
									<div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
										<Leaf className="h-5 w-5 text-green-500" />
									</div>
									<div>
										<p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
											Número de Plantas
										</p>
										<p className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
											{activity.plantCount.toLocaleString()}
										</p>
									</div>
								</div>
							)}

							<div className="flex items-center space-x-3">
								<div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
									<MapPin className="h-5 w-5 text-red-500" />
								</div>
								<div>
									<p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
										Extensión
									</p>
									<p className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
										{activity.area} {activity.areaUnit}
									</p>
								</div>
							</div>

							{activity.transplantDate && (
								<div className="flex items-center space-x-3">
									<div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
										<Calendar className="h-5 w-5 text-blue-500" />
									</div>
									<div>
										<p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
											Fecha de Transplante
										</p>
										<p className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
											{formatDate(activity.transplantDate)}
										</p>
									</div>
								</div>
							)}
						</div>
					</div>

					{/* Gestión de Recursos */}
					<div className="space-y-6">
						<h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
							Gestión de Recursos
						</h3>

						{/* Fertirriego */}
						<div className={`p-4 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
							<div className="flex items-center justify-between mb-4">
								<div className="flex items-center space-x-2">
									<div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
										<Leaf className="w-4 h-4 text-green-600 dark:text-green-400" />
									</div>
									<h4 className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
										Fertirriego - Registro Diario
									</h4>
								</div>
								<button
									onClick={handleAddFertigationDay}
									className="flex items-center space-x-2 px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
								>
									<Plus className="h-4 w-4" />
									<span>Añadir Día</span>
								</button>
							</div>

							{activity.fertigation?.dailyRecords && activity.fertigation.dailyRecords.length > 0 ? (
								<div className="space-y-3">
									{activity.fertigation.dailyRecords.map((record, index) => (
										<div
											key={index}
											className={`p-3 border rounded-lg ${isDarkMode ? 'bg-gray-600 border-gray-500' : 'bg-white border-gray-200'}`}
										>
											<div className="flex items-center justify-between mb-2">
												<span className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
													{new Date(record.date).toLocaleDateString('es-ES')} - {record.fertilizers.length} fertilizante(s)
												</span>
												<div className="flex space-x-2">
													<button
														onClick={() => handleEditFertigationDay(record)}
														className="text-blue-500 hover:text-blue-700 transition-colors"
													>
														<Edit className="h-4 w-4" />
													</button>
													<button
														onClick={() => handleDeleteFertigationDay(index)}
														className="text-red-500 hover:text-red-700 transition-colors"
													>
														<Trash2 className="h-4 w-4" />
													</button>
												</div>
											</div>
											{record.fertilizers.map((fertilizer, fIndex) => (
												<div key={fIndex} className="ml-4 mb-2">
													<div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
														<strong>Fertilizante {fIndex + 1}:</strong> {fertilizer.fertilizerType} - {fertilizer.fertilizerAmount} {fertilizer.fertilizerUnit}
													</div>
													{fertilizer.brand && (
														<div className={`text-xs ml-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
															Marca: {fertilizer.brand} | Proveedor: {fertilizer.supplier} | Coste: {(fertilizer.fertilizerAmount * (fertilizer.price || 0)).toFixed(2)}€
														</div>
													)}
												</div>
											))}
											{record.waterConsumption > 0 && (
												<div className={`text-sm ml-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
													<strong>Agua:</strong> {record.waterConsumption} {record.waterUnit}
												</div>
											)}
											{record.notes && (
												<div className={`text-sm ml-4 mt-2 italic ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
													"{record.notes}"
												</div>
											)}
										</div>
									))}
								</div>
							) : (
								<p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
									No hay registros de fertirriego
								</p>
							)}
						</div>

						{/* Fitosanitarios */}
						<div className={`p-4 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
							<div className="flex items-center justify-between mb-4">
								<div className="flex items-center space-x-2">
									<div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
										<Shield className="w-4 h-4 text-orange-600 dark:text-orange-400" />
									</div>
									<h4 className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
										Fitosanitarios - Registro Diario
									</h4>
								</div>
								<button
									onClick={handleAddPhytosanitaryDay}
									className="flex items-center space-x-2 px-3 py-1 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
								>
									<Plus className="h-4 w-4" />
									<span>Añadir Día</span>
								</button>
							</div>

							<p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
								No hay registros de fitosanitarios
							</p>
						</div>

						{/* Agua */}
						<div className={`p-4 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
							<div className="flex items-center justify-between mb-4">
								<div className="flex items-center space-x-2">
									<div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
										<Droplets className="w-4 h-4 text-blue-600 dark:text-blue-400" />
									</div>
									<h4 className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
										Agua - Consumo Diario
									</h4>
								</div>
								<button
									onClick={handleAddWaterDay}
									className="flex items-center space-x-2 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
								>
									<Plus className="h-4 w-4" />
									<span>Añadir Día</span>
								</button>
							</div>

							{activity.water && (activity.water as any).consumption > 0 ? (
								<div className={`p-3 border rounded-lg ${isDarkMode ? 'bg-gray-600 border-gray-500' : 'bg-white border-gray-200'}`}>
									<div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
										<strong>Consumo:</strong> {(activity.water as any).consumption} {(activity.water as any).unit}
									</div>
									{(activity.water as any).cost > 0 && (
										<div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
											<strong>Coste:</strong> {(activity.water as any).cost.toFixed(2)}€
										</div>
									)}
								</div>
							) : (
								<p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
									No hay registros de consumo de agua
								</p>
							)}
						</div>
					</div>

					{/* Fotos */}
					{activity.photos && activity.photos.length > 0 && (
						<div>
							<h3 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
								Fotografías
							</h3>
							<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
								{activity.photos.map((photo, index) => (
									<div key={index} className="relative">
										<img
											src={photo}
											alt={`Foto ${index + 1}`}
											className="w-full h-32 object-cover rounded-lg"
										/>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Información adicional */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						{/* Fecha y Coste */}
						<div className="space-y-4">
							<div className="flex items-center space-x-3">
								<div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
									<Calendar className="h-5 w-5 text-blue-500" />
								</div>
								<div>
									<p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
										Fecha de Creación
									</p>
									<p className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
										{formatDate(activity.createdAt)}
									</p>
								</div>
							</div>

							<div className="flex items-center space-x-3">
								<div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
									<DollarSign className="h-5 w-5 text-green-500" />
								</div>
								<div>
									<p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
										Coste Total
									</p>
									<p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
										{formatCurrency(activity.totalCost)}
									</p>
								</div>
							</div>
						</div>

						{/* Ubicación y Clima */}
						<div className="space-y-4">
							{activity.location && (
								<div className="flex items-center space-x-3">
									<div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
										<MapPin className="h-5 w-5 text-red-500" />
									</div>
									<div>
										<p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
											Ubicación
										</p>
										<p className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
											{activity.location}
										</p>
									</div>
								</div>
							)}

							{activity.weather && (
								<div className="flex items-center space-x-3">
									<div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
										<Cloud className="h-5 w-5 text-cyan-500" />
									</div>
									<div>
										<p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
											Clima
										</p>
										<p className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
											{activity.weather}
										</p>
									</div>
								</div>
							)}
						</div>
					</div>

					{/* Productos Consumidos */}
					{activity.consumedProducts && activity.consumedProducts.length > 0 && (
						<div>
							<h3 className={`text-lg font-semibold mb-3 flex items-center space-x-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
								<Package className="h-5 w-5 text-blue-600" />
								<span>Productos Consumidos del Inventario</span>
							</h3>
							<div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
								<div className="space-y-3">
									{activity.consumedProducts.map((product, index) => (
										<div key={index} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-600">
											<div className="flex items-center space-x-3">
												<div className={`p-2 rounded-lg ${isDarkMode ? 'bg-blue-900' : 'bg-blue-100'}`}>
													<Package className="h-4 w-4 text-blue-600" />
												</div>
												<div>
													<p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
														{product.productName}
													</p>
													<p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
														Consumido: {product.amount} {product.unit}
													</p>
												</div>
											</div>
										</div>
									))}
								</div>
							</div>
						</div>
					)}

					{/* Notas */}
					{activity.notes && (
						<div>
							<h3 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
								Observaciones Generales
							</h3>
							<div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
								<div className="flex items-start space-x-3">
									<FileText className="h-5 w-5 text-gray-400 mt-0.5" />
									<p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
										{activity.notes}
									</p>
								</div>
							</div>
						</div>
					)}

					{/* Información del sistema */}
					<div className={`pt-6 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
							<div>
								<p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
									Creado: {formatDate(activity.createdAt)}
								</p>
							</div>
							<div>
								<p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
									Actualizado: {formatDate(activity.updatedAt)}
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* Footer */}
				<div className={`flex items-center justify-end p-6 border-t ${
					isDarkMode ? 'border-gray-700' : 'border-gray-200'
				}`}>
					<button
						onClick={onClose}
						className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
					>
						Cerrar
					</button>
				</div>

				{/* Fertigation Day Modal */}
				{showFertigationDayModal && (
					<FertigationDayModal
						isOpen={showFertigationDayModal}
						onClose={() => {
							setShowFertigationDayModal(false)
							setSelectedDay(undefined)
						}}
						onSubmit={handleFertigationDaySubmit}
						existingDay={selectedDay}
						activityName={activity.name}
						isDarkMode={isDarkMode}
					/>
				)}

				{/* Phytosanitary Day Modal */}
				{showPhytosanitaryDayModal && (
					<PhytosanitaryDayModal
						isOpen={showPhytosanitaryDayModal}
						onClose={() => setShowPhytosanitaryDayModal(false)}
						activityName={activity.name}
						isDarkMode={isDarkMode}
						onSubmit={handlePhytosanitaryDaySubmit}
					/>
				)}

				{/* Water Day Modal */}
				{showWaterDayModal && (
					<WaterDayModal
						isOpen={showWaterDayModal}
						onClose={() => setShowWaterDayModal(false)}
						activityName={activity.name}
						isDarkMode={isDarkMode}
						onSubmit={handleWaterDaySubmit}
					/>
				)}
			</div>
		</div>
	)
}

export default ActivityDetailModal 