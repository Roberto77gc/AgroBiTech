import React, { useState, useEffect, Suspense, lazy } from 'react'
import { 
	Plus, 
	Eye, 
	Trash2, 
	BarChart3,
	DollarSign,
	Package,
	Sun,
	Moon,
	LogOut
} from 'lucide-react'
import { toast } from 'react-toastify'
import type { Activity as ActivityType } from '../types'

// Lazy loading para modales pesados
const ActivityFormModal = lazy(() => import('./ActivityFormModal.tsx'))
const ActivityDetailModal = lazy(() => import('./ActivityDetailModal.tsx'))
const InventoryModal = lazy(() => import('./InventoryModal.tsx'))

const SupplierStatsModal = lazy(() => import('./SupplierStatsModal.tsx'))
const ProductManagementModal = lazy(() => import('./ProductManagementModal.tsx'))
const SupplierManagementModal = lazy(() => import('./SupplierManagementModal.tsx'))
const PurchaseRegistrationModal = lazy(() => import('./PurchaseRegistrationModal.tsx'))

// Componente de carga para modales
const ModalLoadingSpinner = () => (
	<div className="flex items-center justify-center p-8">
		<div className="animate-spin rounded-full h-8 w-8 border-2 border-green-500 border-t-transparent"></div>
	</div>
)

interface DashboardProps {
	user: { _id?: string; id?: string; name?: string; email?: string } | null
	logout: () => void
}

const Dashboard: React.FC<DashboardProps> = ({ user, logout }) => {
	const [isDarkMode, setIsDarkMode] = useState(false)
	const [activities, setActivities] = useState<ActivityType[]>([])
	const [stats, setStats] = useState<any>(null)
	const [searchTerm, setSearchTerm] = useState('')
	const [selectedCropType, setSelectedCropType] = useState('all')
	const [showActivityModal, setShowActivityModal] = useState(false)
	const [selectedActivity, setSelectedActivity] = useState<ActivityType | null>(null)
	const [showInventoryModal, setShowInventoryModal] = useState(false)
	const [showProductModal, setShowProductModal] = useState(false)
	const [showSupplierModal, setShowSupplierModal] = useState(false)
	const [showPurchaseModal, setShowPurchaseModal] = useState(false)
	const [showSupplierStatsModal, setShowSupplierStatsModal] = useState(false)

	useEffect(() => {
		loadDashboardData()
	}, [])

	useEffect(() => {
		// Aplicar modo oscuro al body
		if (isDarkMode) {
			document.documentElement.classList.add('dark')
		} else {
			document.documentElement.classList.remove('dark')
		}
	}, [isDarkMode])

	const loadDashboardData = async () => {
		try {
			const token = localStorage.getItem('token')
			const response = await fetch('http://localhost:3000/api/dashboard/stats', {
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				}
			})

			if (response.ok) {
				const data = await response.json()
				setStats(data.stats)
				setActivities(data.recentActivities || [])
			}
		} catch (error) {
			console.error('Error loading dashboard data:', error)
			toast.error('Error al cargar los datos del dashboard')
		}
	}

	const handleActivitySubmit = async (activityData: any) => {
		try {
			const token = localStorage.getItem('token')
			const response = await fetch('http://localhost:3000/api/dashboard/activities', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(activityData)
			})

			if (response.ok) {
				toast.success('Actividad creada exitosamente')
				setShowActivityModal(false)
				loadDashboardData()
			} else {
				toast.error('Error al crear la actividad')
			}
		} catch (error) {
			console.error('Error creating activity:', error)
			toast.error('Error al crear la actividad')
		}
	}

	const handleActivityDelete = async (activityId: string) => {
		if (!confirm('¿Estás seguro de que quieres eliminar esta actividad?')) return

		try {
			const token = localStorage.getItem('token')
			const response = await fetch(`http://localhost:3000/api/dashboard/activities/${activityId}`, {
				method: 'DELETE',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				}
			})

			if (response.ok) {
				toast.success('Actividad eliminada exitosamente')
				loadDashboardData()
			} else {
				toast.error('Error al eliminar la actividad')
			}
		} catch (error) {
			console.error('Error deleting activity:', error)
			toast.error('Error al eliminar la actividad')
		}
	}

	const filteredActivities = activities.filter(activity => {
		const matchesSearch = activity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
							(activity.notes && activity.notes.toLowerCase().includes(searchTerm.toLowerCase()))
		const matchesFilter = selectedCropType === 'all' || activity.cropType === selectedCropType
		return matchesSearch && matchesFilter
	})

	// Agrupar actividades por cycleId para mejor organización
	const groupedActivities = filteredActivities.reduce((groups, activity) => {
		const cycleId = activity.cycleId || 'individual'
		if (!groups[cycleId]) {
			groups[cycleId] = {
				cycleId,
				activities: [],
				totalCost: 0,
				firstDate: null,
				lastDate: null,
				cropType: activity.cropType
			}
		}
		groups[cycleId].activities.push(activity)
		groups[cycleId].totalCost += activity.totalCost
		
		const activityDate = new Date(activity.createdAt)
		if (!groups[cycleId].firstDate || activityDate < groups[cycleId].firstDate) {
			groups[cycleId].firstDate = activityDate
		}
		if (!groups[cycleId].lastDate || activityDate > groups[cycleId].lastDate) {
			groups[cycleId].lastDate = activityDate
		}
		
		return groups
	}, {} as Record<string, {
		cycleId: string
		activities: ActivityType[]
		totalCost: number
		firstDate: Date | null
		lastDate: Date | null
		cropType: string
	}>)

	// Ordenar grupos por fecha más reciente
	const sortedGroups = Object.values(groupedActivities).sort((a, b) => {
		if (!a.lastDate || !b.lastDate) return 0
		return b.lastDate.getTime() - a.lastDate.getTime()
	})

	const getActivityTypeColor = (cropType: string) => {
		const colors: { [key: string]: string } = {
			tomate: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
			pimiento: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
			pepino: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
			berenjena: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
			lechuga: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
			zanahoria: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
			patata: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
			cebolla: 'bg-white text-gray-800 dark:bg-gray-900 dark:text-gray-200 border border-gray-300',
			ajo: 'bg-white text-gray-800 dark:bg-gray-900 dark:text-gray-200 border border-gray-300',
			fresa: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
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
			month: 'short',
			day: 'numeric'
		})
	}

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('es-ES', {
			style: 'currency',
			currency: 'EUR'
		}).format(amount)
	}

	return (
		<div className={`min-h-screen transition-colors ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
			{/* Header */}
			<header className={`border-b transition-colors ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center h-16">
						<div className="flex items-center space-x-4">
							<h1 className="text-xl font-bold text-green-600">AgroDigital</h1>
							<div className="hidden sm:flex items-center space-x-4">
								<button
									onClick={() => setIsDarkMode(!isDarkMode)}
									className={`p-2 rounded-lg transition-colors ${
										isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
									}`}
								>
									{isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
								</button>
							</div>
						</div>
						
						<div className="flex items-center space-x-4">
							<div className="hidden sm:block">
								<p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
									Bienvenido, {user?.name || user?.email || 'Usuario'}
								</p>
							</div>
							<button
								onClick={logout}
								className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
							>
								<LogOut className="h-4 w-4" />
								<span className="hidden sm:inline">Cerrar Sesión</span>
							</button>
						</div>
					</div>
				</div>
			</header>

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Sidebar */}
				<div className="flex flex-col lg:flex-row gap-8">
					<div className="lg:w-64 flex-shrink-0">
						<div className={`rounded-xl shadow-lg border transition-colors ${
							isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
						}`}>
							<div className="p-6">
								<h2 className="text-lg font-semibold mb-4">Navegación</h2>
								
								<div className="space-y-2">
									<div className="space-y-1">
										<h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
											DASHBOARD
										</h3>
										<button
											className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
												isDarkMode ? 'bg-green-600 text-white' : 'bg-green-600 text-white'
											}`}
										>
											Dashboard Básico
										</button>
									</div>
									
									<div className="space-y-1">
										<h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
											GESTIÓN
										</h3>
										<button
											onClick={() => setShowActivityModal(true)}
											className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
												isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
											}`}
										>
											Nueva Actividad
										</button>
										<button
											onClick={() => setShowInventoryModal(true)}
											className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
												isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
											}`}
										>
											Inventario
										</button>
									</div>
								</div>
							</div>
						</div>

						{/* Quick Actions Bar */}
						<div className={`mt-6 rounded-xl shadow-lg border transition-colors ${
							isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
						}`}>
							<div className="p-6">
								<h2 className="text-lg font-semibold mb-4">Acciones Rápidas</h2>
								
								<div className="space-y-3">
									<div className="relative">
										<select
											onChange={(e) => {
												const value = e.target.value
												if (value === 'products') setShowProductModal(true)
												else if (value === 'suppliers') setShowSupplierModal(true)
												else if (value === 'purchases') setShowPurchaseModal(true)
												else if (value === 'stats') setShowSupplierStatsModal(true)
											}}
											className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors ${
												isDarkMode 
													? 'bg-gray-700 border-gray-600 text-white' 
													: 'bg-white border-gray-300 text-gray-900'
											}`}
											defaultValue=""
										>
											<option value="" disabled>Gestión</option>
											<option value="products">Productos y Precios</option>
											<option value="suppliers">Proveedores</option>
											<option value="purchases">Historial de Compras</option>
											<option value="stats">Estadísticas de Proveedores</option>
										</select>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Main Content */}
					<div className="flex-1">
						<div className="space-y-6">
							{/* Stats Cards */}
							{stats && (
								<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
									<div className={`p-4 sm:p-6 rounded-xl shadow-lg border transition-colors ${
										isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
									}`}>
										<div className="flex items-center justify-between">
											<div className="flex-1 min-w-0">
												<p className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
													Gastos Totales
												</p>
												<p className="text-lg sm:text-2xl font-bold truncate">{formatCurrency(stats.totalExpenses)}</p>
											</div>
											<div className="p-2 sm:p-3 bg-green-100 dark:bg-green-900 rounded-lg flex-shrink-0">
												<DollarSign className="h-4 w-4 sm:h-6 sm:w-6 text-green-600" />
											</div>
										</div>
									</div>

									<div className={`p-4 sm:p-6 rounded-xl shadow-lg border transition-colors ${
										isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
									}`}>
										<div className="flex items-center justify-between">
											<div className="flex-1 min-w-0">
												<p className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
													Gastos Mensuales
												</p>
												<p className="text-lg sm:text-2xl font-bold truncate">{formatCurrency(stats.monthlyExpenses)}</p>
											</div>
											<div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900 rounded-lg flex-shrink-0">
												<BarChart3 className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
											</div>
										</div>
									</div>

									<div className={`p-4 sm:p-6 rounded-xl shadow-lg border transition-colors ${
										isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
									}`}>
										<div className="flex items-center justify-between">
											<div className="flex-1 min-w-0">
												<p className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
													Actividades
												</p>
												<p className="text-lg sm:text-2xl font-bold truncate">{stats.activitiesCount}</p>
											</div>
											<div className="p-2 sm:p-3 bg-purple-100 dark:bg-purple-900 rounded-lg flex-shrink-0">
												<BarChart3 className="h-4 w-4 sm:h-6 sm:w-6 text-purple-600" />
											</div>
										</div>
									</div>

									<div className={`p-4 sm:p-6 rounded-xl shadow-lg border transition-colors ${
										isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
									}`}>
										<div className="flex items-center justify-between">
											<div className="flex-1 min-w-0">
												<p className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
													Productos
												</p>
												<p className="text-lg sm:text-2xl font-bold truncate">{stats.productsCount}</p>
											</div>
											<div className="p-2 sm:p-3 bg-orange-100 dark:bg-orange-900 rounded-lg flex-shrink-0">
												<Package className="h-4 w-4 sm:h-6 sm:w-6 text-orange-600" />
											</div>
										</div>
									</div>
								</div>
							)}

							{/* Activities Section */}
							<div className={`rounded-xl shadow-lg border overflow-hidden transition-colors ${
								isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
							}`}>
								<div className="p-6 border-b border-gray-200 dark:border-gray-700">
									<div className="flex items-center justify-between">
										<div>
											<h2 className="text-xl font-bold">Actividades Recientes</h2>
											<p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
												Últimas actividades registradas
											</p>
										</div>
										<button
											onClick={() => setShowActivityModal(true)}
											className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
										>
											<Plus className="h-4 w-4" />
											<span>Nueva Actividad</span>
										</button>
									</div>
								</div>

								<div className="p-6">
									{/* Search and Filter */}
									<div className="flex flex-col sm:flex-row gap-4 mb-6">
										<div className="flex-1">
											<input
												type="text"
												placeholder="Buscar actividades..."
												value={searchTerm}
												onChange={(e) => setSearchTerm(e.target.value)}
												className={`w-full px-4 py-2 border rounded-lg transition-colors ${
													isDarkMode 
														? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
														: 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
												}`}
											/>
										</div>
										<div className="sm:w-48">
											<select
												value={selectedCropType}
												onChange={(e) => setSelectedCropType(e.target.value)}
												className={`w-full px-4 py-2 border rounded-lg transition-colors ${
													isDarkMode 
														? 'bg-gray-700 border-gray-600 text-white' 
														: 'bg-white border-gray-300 text-gray-900'
												}`}
											>
												<option value="all">Todos los cultivos</option>
												{Array.from(new Set(activities.map(a => a.cropType))).map(cropType => (
													<option key={cropType} value={cropType}>{cropType}</option>
												))}
											</select>
										</div>
									</div>

									{/* Activities List */}
									<div className="space-y-4">
										{sortedGroups.length === 0 ? (
											<div className="text-center py-8">
												<p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
													No se encontraron actividades
												</p>
											</div>
										) : (
											sortedGroups.map((group) => (
												<div
													key={group.cycleId}
													className={`rounded-lg border transition-colors ${
														isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
													}`}
												>
													{/* Group Header */}
													<div className="p-4 border-b border-gray-200 dark:border-gray-600">
														<div className="flex items-center justify-between">
															<div className="flex items-center space-x-3">
																<span className={`px-3 py-1 text-sm font-medium rounded-full ${getActivityTypeColor(group.cropType)}`}>
																	{group.cropType}
																</span>
																<div>
																	<h3 className="font-medium">
																		{group.cycleId === 'individual' ? 'Actividades Individuales' : `Ciclo: ${group.cycleId}`}
																	</h3>
																	<p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
																		{group.activities.length} actividad{group.activities.length !== 1 ? 'es' : ''} • 
																		{group.firstDate && group.lastDate && (
																			` ${formatDate(group.firstDate)} - ${formatDate(group.lastDate)}`
																		)}
																	</p>
																</div>
															</div>
															<div className="text-right">
																<p className="font-medium text-green-600">
																	{formatCurrency(group.totalCost)}
																</p>
																<p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
																	Total del ciclo
																</p>
															</div>
														</div>
													</div>
													
													{/* Group Activities */}
													<div className="p-4 space-y-3">
														{group.activities.map((activity) => (
															<div
																key={activity._id}
																className={`p-3 rounded-lg border transition-colors ${
																	isDarkMode ? 'bg-gray-600 border-gray-500' : 'bg-white border-gray-200'
																}`}
															>
																<div className="flex items-center justify-between">
																	<div className="flex-1">
																		<div className="flex items-center space-x-3 mb-1">
																			<span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
																				{formatDate(activity.createdAt)}
																			</span>
																			{activity.dayNumber && (
																				<span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
																					Día {activity.dayNumber}
																				</span>
																			)}
																		</div>
																		<h4 className="font-medium text-sm">{activity.name}</h4>
																		{activity.notes && (
																			<p className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mt-1`}>
																				{activity.notes}
																			</p>
																		)}
																		<div className="flex items-center space-x-4 mt-2">
																			<span className="font-medium text-green-600 text-sm">
																				{formatCurrency(activity.totalCost)}
																			</span>
																			{activity.location && (
																				<span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
																					📍 {activity.location}
																				</span>
																			)}
																		</div>
																	</div>
																	<div className="flex items-center space-x-2">
																		<button
																			onClick={() => setSelectedActivity(activity)}
																			className={`p-2 rounded-lg transition-colors ${
																				isDarkMode ? 'hover:bg-gray-500' : 'hover:bg-gray-100'
																			}`}
																		>
																			<Eye className="h-4 w-4" />
																		</button>
																		<button
																			onClick={() => handleActivityDelete(activity._id)}
																			className={`p-2 rounded-lg transition-colors ${
																				isDarkMode ? 'hover:bg-gray-500' : 'hover:bg-gray-100'
																			}`}
																		>
																			<Trash2 className="h-4 w-4 text-red-500" />
																		</button>
																	</div>
																</div>
															</div>
														))}
													</div>
												</div>
											))
										)}
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Modals */}
			{showActivityModal && (
				<Suspense fallback={<ModalLoadingSpinner />}>
					<ActivityFormModal
						isOpen={showActivityModal}
						onClose={() => setShowActivityModal(false)}
						onSubmit={handleActivitySubmit}
						isDarkMode={isDarkMode}
					/>
				</Suspense>
			)}

			{selectedActivity && (
				<Suspense fallback={<ModalLoadingSpinner />}>
					<ActivityDetailModal
						activity={selectedActivity}
						isOpen={!!selectedActivity}
						onClose={() => setSelectedActivity(null)}
						isDarkMode={isDarkMode}
					/>
				</Suspense>
			)}

			{showInventoryModal && (
				<Suspense fallback={<ModalLoadingSpinner />}>
					<InventoryModal
						isOpen={showInventoryModal}
						onClose={() => setShowInventoryModal(false)}
						isDarkMode={isDarkMode}
					/>
				</Suspense>
			)}

			{showProductModal && (
				<Suspense fallback={<ModalLoadingSpinner />}>
					<ProductManagementModal
						isOpen={showProductModal}
						onClose={() => setShowProductModal(false)}
						isDarkMode={isDarkMode}
					/>
				</Suspense>
			)}

			{showSupplierModal && (
				<Suspense fallback={<ModalLoadingSpinner />}>
					<SupplierManagementModal
						isOpen={showSupplierModal}
						onClose={() => setShowSupplierModal(false)}
						isDarkMode={isDarkMode}
					/>
				</Suspense>
			)}

			{showPurchaseModal && (
				<Suspense fallback={<ModalLoadingSpinner />}>
					<PurchaseRegistrationModal
						isOpen={showPurchaseModal}
						onClose={() => setShowPurchaseModal(false)}
						isDarkMode={isDarkMode}
					/>
				</Suspense>
			)}

			{showSupplierStatsModal && (
				<Suspense fallback={<ModalLoadingSpinner />}>
					<SupplierStatsModal
						isOpen={showSupplierStatsModal}
						onClose={() => setShowSupplierStatsModal(false)}
						isDarkMode={isDarkMode}
					/>
				</Suspense>
			)}
		</div>
	)
}

export default Dashboard