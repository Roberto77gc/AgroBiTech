import React, { useState, useEffect, Suspense, lazy } from 'react'
import { 
	Plus, 
	Search, 
	Eye, 
	Trash2,
	BarChart3,
	Package,
	Activity,
	Settings,
	Sun,
	Moon,
	LogOut,
	User,
	Bell,
	Menu,
	X,
	DollarSign,
	Users,
	ShoppingCart
} from 'lucide-react'
import { toast } from 'react-toastify'
import type { Activity as ActivityType, DashboardStats } from '../types'

// Lazy loading para modales pesados
const ActivityFormModal = lazy(() => import('./ActivityFormModal.tsx'))
const ActivityDetailModal = lazy(() => import('./ActivityDetailModal.tsx'))
const InventoryModal = lazy(() => import('./InventoryModal.tsx'))
const AdvancedDashboard = lazy(() => import('./AdvancedDashboard.tsx'))
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
	const [sidebarOpen, setSidebarOpen] = useState(false)
	const [showActivityModal, setShowActivityModal] = useState(false)
	const [showInventoryModal, setShowInventoryModal] = useState(false)
	const [showSupplierStatsModal, setShowSupplierStatsModal] = useState(false)
	const [showProductManagementModal, setShowProductManagementModal] = useState(false)
	const [showSupplierManagementModal, setShowSupplierManagementModal] = useState(false)
	const [showPurchaseRegistrationModal, setShowPurchaseRegistrationModal] = useState(false)
	const [selectedActivity, setSelectedActivity] = useState<ActivityType | null>(null)
	const [activities, setActivities] = useState<ActivityType[]>([])
	const [stats, setStats] = useState<DashboardStats | null>(null)
	const [searchTerm, setSearchTerm] = useState('')
	const [filterType, setFilterType] = useState<string>('all')
	const [currentView, setCurrentView] = useState<'basic' | 'advanced'>('advanced')

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
		const matchesFilter = filterType === 'all' || activity.cropType === filterType
		return matchesSearch && matchesFilter
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
			{/* Sidebar */}
			<div className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out ${
				sidebarOpen ? 'translate-x-0' : '-translate-x-full'
			} lg:translate-x-0 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-xl`}>
				<div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
					<h2 className="text-xl font-bold text-green-600">AgroDigital</h2>
					<button
						onClick={() => setSidebarOpen(false)}
						className={`p-2 rounded-lg lg:hidden ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
					>
						<X className="h-5 w-5" />
					</button>
				</div>
				
				<nav className="p-6 space-y-4">
					<div className="space-y-2">
						<h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
							Dashboard
						</h3>
						<button
							onClick={() => setCurrentView('basic')}
							className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
								currentView === 'basic' 
									? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200' 
									: 'hover:bg-gray-100 dark:hover:bg-gray-700'
							}`}
						>
							<BarChart3 className="h-5 w-5" />
							<span>Dashboard Básico</span>
						</button>
						<button
							onClick={() => setCurrentView('advanced')}
							className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
								currentView === 'advanced' 
									? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200' 
									: 'hover:bg-gray-100 dark:hover:bg-gray-700'
							}`}
						>
							<BarChart3 className="h-5 w-5" />
							<span>Dashboard Avanzado</span>
						</button>
					</div>
					
					<div className="space-y-2">
						<h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
							Gestión
						</h3>
						<button
							onClick={() => setShowActivityModal(true)}
							className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
						>
							<Activity className="h-5 w-5" />
							<span>Nueva Actividad</span>
						</button>
						<button
							onClick={() => setShowInventoryModal(true)}
							className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
						>
							<Package className="h-5 w-5" />
							<span>Inventario</span>
						</button>
					</div>
				</nav>
			</div>

			{/* Overlay para cerrar sidebar */}
			{sidebarOpen && (
				<div 
					className="fixed inset-0 z-40 bg-black bg-opacity-50"
					onClick={() => setSidebarOpen(false)}
				/>
			)}

			{/* Main content */}
			<div className="flex-1 flex flex-col min-h-screen lg:ml-64">
				{/* Header */}
				<header className={`sticky top-0 z-30 border-b transition-colors ${
					isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
				}`}>
					<div className="flex items-center justify-between px-4 sm:px-6 py-4">
						<div className="flex items-center space-x-3 sm:space-x-4">
							<button
								onClick={() => setSidebarOpen(true)}
								className={`p-2 rounded-lg lg:hidden ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
							>
								<Menu className="h-5 w-5 sm:h-6 sm:w-6" />
							</button>
							<div>
								<h1 className="text-lg sm:text-2xl font-bold">Dashboard</h1>
								<p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
									Bienvenido, {user?.name || user?.email}
								</p>
							</div>
						</div>
						
						<div className="flex items-center space-x-2 sm:space-x-4">
							<button
								onClick={() => setIsDarkMode(!isDarkMode)}
								className={`p-2 rounded-lg transition-colors ${
									isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
								}`}
								title={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
							>
								{isDarkMode ? <Sun className="h-4 w-4 sm:h-5 sm:w-5" /> : <Moon className="h-4 w-4 sm:h-5 sm:w-5" />}
							</button>
							
							<div className="relative">
								<button className={`p-2 rounded-lg transition-colors ${
									isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
								}`}
								title="Notificaciones">
									<Bell className="h-4 w-4 sm:h-5 sm:w-5" />
								</button>
							</div>
							
							<div className="relative">
								<button className={`p-2 rounded-lg transition-colors ${
									isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
								}`}
								title="Perfil">
									<User className="h-4 w-4 sm:h-5 sm:w-5" />
								</button>
							</div>
							
							<button
								onClick={logout}
								className={`p-2 rounded-lg transition-colors ${
									isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
								}`}
								title="Cerrar sesión">
								<LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
							</button>
						</div>
					</div>
				</header>

				{/* Content */}
				<main className="flex-1 p-4 sm:p-6">
					{/* Welcome Message for New Users */}
					{stats && stats.activitiesCount === 0 && stats.productsCount === 0 && (
						<div className="mb-6">
							<div className={`p-6 rounded-xl shadow-lg border transition-colors ${
								isDarkMode ? 'bg-gradient-to-r from-green-900 to-blue-900 border-green-700' : 'bg-gradient-to-r from-green-50 to-blue-50 border-green-200'
							}`}>
								<div className="text-center">
									<h2 className="text-xl font-bold mb-2">¡Bienvenido a AgroDigital!</h2>
									<p className={`mb-4 ${isDarkMode ? 'text-gray-200' : 'text-gray-600'}`}>
										Comienza a gestionar tu explotación agrícola de manera digital. 
										Aquí tienes algunas acciones para empezar:
									</p>
									<div className="flex flex-wrap justify-center gap-3">
										<button
											onClick={() => setShowActivityModal(true)}
											className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
										>
											<Plus className="h-4 w-4" />
											<span>Registrar Primera Actividad</span>
										</button>
										<button
											onClick={() => setShowInventoryModal(true)}
											className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
										>
											<Package className="h-4 w-4" />
											<span>Crear Inventario</span>
										</button>
									</div>
								</div>
							</div>
						</div>
					)}

					{/* Quick Actions Bar */}
					<div className="mb-6">
						<div className={`p-4 rounded-xl shadow-lg border transition-colors ${
							isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
						}`}>
							<h2 className="text-lg font-semibold mb-3">Acciones Rápidas</h2>
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-8 gap-3">
								<button
									onClick={() => setShowActivityModal(true)}
									className="flex items-center justify-center space-x-2 p-3 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors"
								>
									<Plus className="h-4 w-4" />
									<span className="text-sm font-medium">Nueva Actividad</span>
								</button>
								<button
									onClick={() => setShowInventoryModal(true)}
									className="flex items-center justify-center space-x-2 p-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
								>
									<Package className="h-4 w-4" />
									<span className="text-sm font-medium">Gestionar Inventario</span>
								</button>
								<button
									onClick={() => setCurrentView('advanced')}
									className="flex items-center justify-center space-x-2 p-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors"
								>
									<BarChart3 className="h-4 w-4" />
									<span className="text-sm font-medium">Dashboard Avanzado</span>
								</button>
								<button
									onClick={() => loadDashboardData()}
									className="flex items-center justify-center space-x-2 p-3 rounded-lg bg-gray-600 hover:bg-gray-700 text-white transition-colors"
								>
									<Settings className="h-4 w-4" />
									<span className="text-sm font-medium">Actualizar Datos</span>
								</button>
								<button
									onClick={() => setShowSupplierStatsModal(true)}
									className="flex items-center justify-center space-x-2 p-3 rounded-lg bg-orange-600 hover:bg-orange-700 text-white transition-colors"
								>
									<Users className="h-4 w-4" />
									<span className="text-sm font-medium">Análisis Proveedores</span>
								</button>
								<button
									onClick={() => setShowProductManagementModal(true)}
									className="flex items-center justify-center space-x-2 p-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
								>
									<Package className="h-4 w-4" />
									<span className="text-sm font-medium">Gestión Productos</span>
								</button>
								<button
									onClick={() => setShowSupplierManagementModal(true)}
									className="flex items-center justify-center space-x-2 p-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors"
								>
									<Users className="h-4 w-4" />
									<span className="text-sm font-medium">Gestión Proveedores</span>
								</button>
								<button
									onClick={() => setShowPurchaseRegistrationModal(true)}
									className="flex items-center justify-center space-x-2 p-3 rounded-lg bg-teal-600 hover:bg-teal-700 text-white transition-colors"
								>
									<ShoppingCart className="h-4 w-4" />
									<span className="text-sm font-medium">Registro Compras</span>
								</button>
							</div>
						</div>
					</div>

					{currentView === 'advanced' ? (
						<AdvancedDashboard isDarkMode={isDarkMode} userId={user?.id || user?._id || ''} />
					) : (
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
												<Activity className="h-4 w-4 sm:h-6 sm:w-6 text-purple-600" />
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
										<div className="relative flex-1">
											<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
											<input
												type="text"
												placeholder="Buscar actividades..."
												value={searchTerm}
												onChange={(e) => setSearchTerm(e.target.value)}
												className={`w-full pl-10 pr-4 py-2 border rounded-lg transition-colors ${
													isDarkMode 
														? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
														: 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
												}`}
											/>
										</div>
										<select
											value={filterType}
											onChange={(e) => setFilterType(e.target.value)}
											className={`px-4 py-2 border rounded-lg transition-colors ${
												isDarkMode 
													? 'bg-gray-700 border-gray-600 text-white' 
													: 'bg-white border-gray-300 text-gray-900'
											}`}
										>
											<option value="all">Todos los cultivos</option>
											<option value="tomate">Tomate</option>
											<option value="pimiento">Pimiento</option>
											<option value="pepino">Pepino</option>
											<option value="berenjena">Berenjena</option>
											<option value="lechuga">Lechuga</option>
											<option value="zanahoria">Zanahoria</option>
											<option value="patata">Patata</option>
											<option value="cebolla">Cebolla</option>
											<option value="ajo">Ajo</option>
											<option value="fresa">Fresa</option>
											<option value="uva">Uva</option>
											<option value="olivo">Olivo</option>
											<option value="almendro">Almendro</option>
											<option value="cereales">Cereales</option>
											<option value="legumbres">Legumbres</option>
											<option value="otro">Otro</option>
										</select>
									</div>

									{/* Activities List */}
									<div className="space-y-4">
										{filteredActivities.length === 0 ? (
											<div className="text-center py-8">
												<p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
													No se encontraron actividades
												</p>
											</div>
										) : (
											filteredActivities.map((activity) => (
												<div
													key={activity._id}
													className={`p-4 rounded-lg border transition-colors ${
														isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
													}`}
												>
													<div className="flex items-center justify-between">
														<div className="flex-1">
															<div className="flex items-center space-x-3 mb-2">
																<span className={`px-2 py-1 text-xs font-medium rounded-full ${getActivityTypeColor(activity.cropType)}`}>
																	{activity.cropType}
																</span>
																<span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
																	{formatDate(activity.createdAt)}
																</span>
															</div>
															<h3 className="font-medium mb-1">{activity.name}</h3>
															<p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
																{activity.notes || 'Sin observaciones'}
															</p>
															<div className="flex items-center space-x-4 mt-2">
																<span className="font-medium text-green-600">
																	{formatCurrency(activity.totalCost)}
																</span>
																{activity.location && (
																	<span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
																		📍 {activity.location}
																	</span>
																)}
															</div>
														</div>
														<div className="flex items-center space-x-2">
															<button
																onClick={() => setSelectedActivity(activity)}
																className={`p-2 rounded-lg transition-colors ${
																	isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
																}`}
															>
																<Eye className="h-4 w-4" />
															</button>
															<button
																onClick={() => handleActivityDelete(activity._id)}
																className={`p-2 rounded-lg transition-colors ${
																	isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
																}`}
															>
																<Trash2 className="h-4 w-4 text-red-500" />
															</button>
														</div>
													</div>
												</div>
											))
										)}
									</div>
								</div>
							</div>
						</div>
					)}
				</main>
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
						isOpen={!!selectedActivity}
						onClose={() => setSelectedActivity(null)}
						activity={selectedActivity}
						isDarkMode={isDarkMode}
					/>
				</Suspense>
			)}

			{showInventoryModal && (
				<Suspense fallback={<ModalLoadingSpinner />}>
					<InventoryModal
						isOpen={showInventoryModal}
						onClose={() => setShowInventoryModal(false)}
						onProductAdded={() => {
							toast.success('Producto añadido exitosamente')
							loadDashboardData()
						}}
						onProductUpdated={() => {
							toast.success('Producto actualizado exitosamente')
							loadDashboardData()
						}}
						onProductDeleted={() => {
							toast.success('Producto eliminado exitosamente')
							loadDashboardData()
						}}
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

			{showProductManagementModal && (
				<Suspense fallback={<ModalLoadingSpinner />}>
					<ProductManagementModal
						isOpen={showProductManagementModal}
						onClose={() => setShowProductManagementModal(false)}
						isDarkMode={isDarkMode}
					/>
				</Suspense>
			)}

			{showSupplierManagementModal && (
				<Suspense fallback={<ModalLoadingSpinner />}>
					<SupplierManagementModal
						isOpen={showSupplierManagementModal}
						onClose={() => setShowSupplierManagementModal(false)}
						isDarkMode={isDarkMode}
					/>
				</Suspense>
			)}

			{showPurchaseRegistrationModal && (
				<Suspense fallback={<ModalLoadingSpinner />}>
					<PurchaseRegistrationModal
						isOpen={showPurchaseRegistrationModal}
						onClose={() => setShowPurchaseRegistrationModal(false)}
						isDarkMode={isDarkMode}
					/>
				</Suspense>
			)}
		</div>
	)
}

export default Dashboard