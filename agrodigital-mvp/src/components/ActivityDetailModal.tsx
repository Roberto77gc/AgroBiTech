import React, { useState } from 'react'
import { X, Calendar, MapPin, Cloud, FileText, DollarSign, Tag, Leaf, Shield, Zap, Droplets, Package, Plus, Edit, Trash2 } from 'lucide-react'
import type { Activity, DailyFertigationRecord } from '../types'
import FertigationDayModal from './FertigationDayModal'

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
					{(activity.fertigation?.enabled || activity.phytosanitary?.enabled || activity.water?.enabled || activity.energy?.enabled) && (
						<div>
							<h3 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
								Gestión de Recursos
							</h3>
							<div className="space-y-4">
								{/* Fertirriego */}
								{activity.fertigation?.enabled && (
									<div className={`p-4 rounded-lg border ${isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
										<div className="flex items-center justify-between mb-3">
											<div className="flex items-center space-x-2">
												<Leaf className="h-5 w-5 text-green-600" />
												<h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
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
										
										{activity.fertigation.dailyRecords && activity.fertigation.dailyRecords.length > 0 ? (
											<div className="space-y-3">
												{activity.fertigation.dailyRecords.map((record, index) => (
													<div key={index} className={`p-3 rounded border ${isDarkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-white'}`}>
														<div className="flex items-center justify-between mb-3">
															<h6 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
																{record.date} - {record.fertilizers.length} fertilizante(s)
															</h6>
															<div className="flex items-center space-x-2">
																<button
																	onClick={() => handleEditFertigationDay(record)}
																	className={`p-1 rounded transition-colors ${
																		isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
																	}`}
																	title="Editar día"
																>
																	<Edit className="h-4 w-4 text-blue-500" />
																</button>
																<button
																	onClick={() => handleDeleteFertigationDay(index)}
																	className={`p-1 rounded transition-colors ${
																		isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
																	}`}
																	title="Eliminar día"
																>
																	<Trash2 className="h-4 w-4 text-red-500" />
																</button>
															</div>
														</div>
														
														{/* Fertilizantes */}
														<div className="space-y-2 mb-3">
															{record.fertilizers.map((fertilizer, fertilizerIndex) => (
																<div key={fertilizerIndex} className={`p-2 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
																	<div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
																		<div>
																			<p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Fertilizante {fertilizerIndex + 1}:</p>
																			<p className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
																				{fertilizer.fertilizerType} - {fertilizer.fertilizerAmount} {fertilizer.fertilizerUnit}
																			</p>
																		</div>
																		<div>
																			<p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Coste:</p>
																			<p className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
																				{formatCurrency(fertilizer.cost)}
																			</p>
																		</div>
																		{fertilizer.notes && (
																			<div className="md:col-span-2">
																				<p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Notas:</p>
																				<p className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{fertilizer.notes}</p>
																			</div>
																		)}
																		{/* Información del proveedor */}
																		{(fertilizer.brand || fertilizer.supplier || fertilizer.purchaseDate) && (
																			<div className="md:col-span-2">
																				<p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Información del Proveedor:</p>
																				<div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
																					{fertilizer.brand && (
																						<p>Marca: {fertilizer.brand}</p>
																					)}
																					{fertilizer.supplier && (
																						<p>Proveedor: {fertilizer.supplier}</p>
																					)}
																					{fertilizer.purchaseDate && (
																						<p>Fecha de Compra: {new Date(fertilizer.purchaseDate).toLocaleDateString('es-ES')}</p>
																					)}
																				</div>
																			</div>
																		)}
																	</div>
																</div>
															))}
														</div>
														
														{/* Agua y coste total */}
														<div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm pt-2 border-t border-gray-300 dark:border-gray-600">
															<div>
																<p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Agua:</p>
																<p className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
																	{record.waterConsumption} {record.waterUnit}
																</p>
															</div>
															<div>
																<p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Coste Total:</p>
																<p className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
																	{formatCurrency(record.totalCost)}
																</p>
															</div>
															{record.notes && (
																<div className="md:col-span-2">
																	<p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Notas del día:</p>
																	<p className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{record.notes}</p>
																</div>
															)}
														</div>
													</div>
												))}
											</div>
										) : (
											<p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
												No hay registros diarios de fertirriego
											</p>
										)}
										
										{activity.fertigation.notes && (
											<div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">
												<p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Notas generales:</p>
												<p className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{activity.fertigation.notes}</p>
											</div>
										)}
									</div>
								)}

								{/* Tratamientos Fitosanitarios */}
								{activity.phytosanitary?.enabled && (
									<div className={`p-4 rounded-lg border ${isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
										<div className="flex items-center space-x-2 mb-3">
											<Shield className="h-5 w-5 text-orange-600" />
											<h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
												Tratamientos Fitosanitarios
											</h4>
										</div>
										<div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
											{activity.phytosanitary.treatmentType && (
												<div>
													<p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Tipo:</p>
													<p className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{activity.phytosanitary.treatmentType}</p>
												</div>
											)}
											{activity.phytosanitary.productName && (
												<div>
													<p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Producto:</p>
													<p className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{activity.phytosanitary.productName}</p>
												</div>
											)}
											{activity.phytosanitary.applicationDate && (
												<div>
													<p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Fecha:</p>
													<p className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{formatDate(activity.phytosanitary.applicationDate)}</p>
												</div>
											)}
											{activity.phytosanitary.dosage && (
												<div>
													<p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Dosis:</p>
													<p className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{activity.phytosanitary.dosage}</p>
												</div>
											)}
											{activity.phytosanitary.notes && (
												<div className="md:col-span-2">
													<p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Notas:</p>
													<p className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{activity.phytosanitary.notes}</p>
												</div>
											)}
										</div>
									</div>
								)}

								{/* Agua */}
								{activity.water?.enabled && (
									<div className={`p-4 rounded-lg border ${isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
										<div className="flex items-center space-x-2 mb-3">
											<Droplets className="h-5 w-5 text-blue-600" />
											<h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
												Gestión del Agua
											</h4>
										</div>
										<div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
											{activity.water.waterSource && (
												<div>
													<p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Fuente:</p>
													<p className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{activity.water.waterSource}</p>
												</div>
											)}
											{activity.water.irrigationType && (
												<div>
													<p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Riego:</p>
													<p className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{activity.water.irrigationType}</p>
												</div>
											)}
											{activity.water.dailyConsumption && (
												<div>
													<p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Consumo Diario:</p>
													<p className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
														{activity.water.dailyConsumption} {activity.water.waterUnit}
													</p>
												</div>
											)}
											{activity.water.cost && (
												<div>
													<p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Coste Diario:</p>
													<p className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
														{formatCurrency(activity.water.cost)}
													</p>
												</div>
											)}
											{activity.water.notes && (
												<div className="md:col-span-2">
													<p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Notas:</p>
													<p className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{activity.water.notes}</p>
												</div>
											)}
										</div>
									</div>
								)}

								{/* Energía */}
								{activity.energy?.enabled && (
									<div className={`p-4 rounded-lg border ${isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
										<div className="flex items-center space-x-2 mb-3">
											<Zap className="h-5 w-5 text-yellow-600" />
											<h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
												Gestión de Energía
											</h4>
										</div>
										<div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
											{activity.energy.energyType && (
												<div>
													<p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Tipo:</p>
													<p className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{activity.energy.energyType}</p>
												</div>
											)}
											{activity.energy.dailyConsumption && (
												<div>
													<p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Consumo Diario:</p>
													<p className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
														{activity.energy.dailyConsumption} {activity.energy.energyUnit}
													</p>
												</div>
											)}
											{activity.energy.cost && (
												<div>
													<p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Coste Diario:</p>
													<p className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
														{formatCurrency(activity.energy.cost)}
													</p>
												</div>
											)}
											{activity.energy.notes && (
												<div className="md:col-span-2">
													<p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Notas:</p>
													<p className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{activity.energy.notes}</p>
												</div>
											)}
										</div>
									</div>
								)}
							</div>
						</div>
					)}

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
			</div>
		</div>
	)
}

export default ActivityDetailModal 