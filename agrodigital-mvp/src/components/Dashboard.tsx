import React, { useState, useEffect, Suspense, lazy } from 'react'
import { 
	Plus, 
	Eye, 
	Trash2, 
	BarChart3,
	DollarSign,
	Package,
	Calendar,
	MapPin,
	Search,
	Filter
} from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import { useToast } from './ui/ToastProvider'
import { formatCurrencyEUR } from '../utils/format'
import { activityAPI } from '../services/api'
import type { Activity as ActivityType } from '../types'
import CacheStatus from './common/CacheStatus'
import AnalyticsPanel from './common/AnalyticsPanel'
import ExtendedKPIs from './common/ExtendedKPIs'

// Lazy loading para modales pesados
const ActivityFormModal = lazy(() => import('./ActivityFormModal.tsx'))
const ActivityDetailModal = lazy(() => import('./ActivityDetailModal.tsx'))
const InventoryModal = lazy(() => import('./InventoryModal.tsx'))

// Componente de carga para modales
const ModalLoadingSpinner = () => (
	<div className="flex items-center justify-center p-8">
		<div className="animate-spin rounded-full h-8 w-8 border-2 border-green-500 border-t-transparent"></div>
	</div>
)

const Dashboard: React.FC = () => {
    const { isDarkMode } = useOutletContext<{ isDarkMode: boolean }>()
    const { success: toastSuccess, error: toastError } = useToast()
    const [activities, setActivities] = useState<ActivityType[]>([])
    const [stats, setStats] = useState<any>(null)
    const [isLoadingDashboard, setIsLoadingDashboard] = useState<boolean>(false)
    const [searchTerm, setSearchTerm] = useState<string>('')
    const [selectedCropType, setSelectedCropType] = useState<string>('all')
    const [sortKey, setSortKey] = useState<'date' | 'cost'>('date')
	const [showActivityModal, setShowActivityModal] = useState(false)
	const [selectedActivity, setSelectedActivity] = useState<ActivityType | null>(null)
	const [showInventoryModal, setShowInventoryModal] = useState(false)
	const [confirmDeleteActivityId, setConfirmDeleteActivityId] = useState<string | null>(null)
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false)

	useEffect(() => {
		loadDashboardData()
        const onChanged = () => loadDashboardData()
        window.addEventListener('app:data-changed', onChanged as EventListener)
        return () => window.removeEventListener('app:data-changed', onChanged as EventListener)
	}, [])

	const loadDashboardData = async () => {
		setIsLoadingDashboard(true)
		try {
			// Cargar estadísticas del dashboard
			const token = localStorage.getItem('token')
			const statsResponse = await fetch('http://localhost:3000/api/dashboard/stats', {
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				}
			})
			const statsData = await statsResponse.json()
			if (statsData.success) {
				setStats(statsData.data)
			}

			// Cargar actividades recientes
			const activitiesResponse = await fetch('http://localhost:3000/api/dashboard/activities?limit=10', {
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				}
			})
			const activitiesData = await activitiesResponse.json()
			if (activitiesData.success) {
				setActivities(activitiesData.data)
			}
		} catch (error) {
			console.error('Error loading dashboard data:', error)
			toastError('Error al cargar datos del dashboard')
		} finally {
			setIsLoadingDashboard(false)
		}
	}

	const handleActivitySubmit = async (activityData: any) => {
		try {
			const response = await activityAPI.create(activityData)
			if (response?.success) {
				toastSuccess('Actividad creada exitosamente')
				setShowActivityModal(false)
				loadDashboardData()
			} else {
				toastError(response?.message || 'Error al crear la actividad')
			}
		} catch (error) {
			console.error('Error creating activity:', error)
			toastError('Error al crear la actividad')
		}
	}

    const handleActivityDelete = (activityId: string) => {
        setConfirmDeleteActivityId(activityId)
        setIsConfirmDeleteOpen(true)
    }

    const confirmDelete = async () => {
        const activityId = confirmDeleteActivityId
        if (!activityId) { setIsConfirmDeleteOpen(false); return }
        try {
            const response = await activityAPI.delete(activityId)
            if (response?.success) {
                toastSuccess('Actividad eliminada exitosamente')
                loadDashboardData()
            } else {
                toastError(response?.message || 'Error al eliminar la actividad')
            }
        } catch (error) {
            console.error('Error deleting activity:', error)
            toastError('Error al eliminar la actividad')
        } finally {
            setIsConfirmDeleteOpen(false)
            setConfirmDeleteActivityId(null)
        }
    }

    const cancelDelete = () => {
        setIsConfirmDeleteOpen(false)
        setConfirmDeleteActivityId(null)
    }

    // Refrescar dashboard cuando se actualicen días dentro del detalle
    const handleActivityChanged = () => {
        loadDashboardData()
    }

    const filteredActivities = activities.filter(activity => {
		const matchesSearch = activity.cropType.toLowerCase().includes(searchTerm.toLowerCase()) ||
							(activity.notes && activity.notes.toLowerCase().includes(searchTerm.toLowerCase()))
		const matchesFilter = selectedCropType === 'all' || activity.cropType === selectedCropType
		return matchesSearch && matchesFilter
	})

	// Agrupar actividades por cropType para mejor organización
	const groupedActivities = filteredActivities.reduce((groups, activity) => {
		const cropType = activity.cropType || 'otros'
		if (!groups[cropType]) {
			groups[cropType] = {
				cropType,
				activities: [],
				totalCost: 0,
				firstDate: null,
				lastDate: null,
				totalArea: 0
			}
		}
		groups[cropType].activities.push(activity)
		groups[cropType].totalCost += activity.totalCost || 0
		groups[cropType].totalArea += activity.surfaceArea || 0
		
		const activityDate = new Date(activity.date)
		if (!groups[cropType].firstDate || activityDate < groups[cropType].firstDate) {
			groups[cropType].firstDate = activityDate
		}
		if (!groups[cropType].lastDate || activityDate > groups[cropType].lastDate) {
			groups[cropType].lastDate = activityDate
		}
		
		return groups
	}, {} as Record<string, {
		cropType: string
		activities: ActivityType[]
		totalCost: number
		firstDate: Date | null
		lastDate: Date | null
		totalArea: number
	}>)

	// Ordenar grupos por fecha más reciente o coste
    const sortedGroups = Object.values(groupedActivities).sort((a, b) => {
        if (sortKey === 'cost') {
            return (b.totalCost || 0) - (a.totalCost || 0)
        }
        if (!a.lastDate || !b.lastDate) return 0
        return b.lastDate.getTime() - a.lastDate.getTime()
    })

	const getActivityTypeColor = (cropType: string) => {
		const colors: { [key: string]: string } = {
			tomate: 'bg-red-100 text-red-800',
			pimiento: 'bg-orange-100 text-orange-800',
			pepino: 'bg-green-100 text-green-800',
			berenjena: 'bg-purple-100 text-purple-800',
			lechuga: 'bg-emerald-100 text-emerald-800',
			zanahoria: 'bg-orange-100 text-orange-800',
			patata: 'bg-yellow-100 text-yellow-800',
			cebolla: 'bg-white text-gray-800 border border-gray-300',
			ajo: 'bg-white text-gray-800 border border-gray-300',
			fresa: 'bg-pink-100 text-pink-800',
			uva: 'bg-purple-100 text-purple-800',
			olivo: 'bg-green-100 text-green-800',
			almendro: 'bg-amber-100 text-amber-800',
			cereales: 'bg-yellow-100 text-yellow-800',
			legumbres: 'bg-green-100 text-green-800',
			otro: 'bg-slate-100 text-slate-800'
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

    const formatCurrency = (amount: number) => formatCurrencyEUR(Number(amount))

	return (
		<div className={`min-h-screen transition-colors duration-300 ${
			isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
	 }`}>
			{/* Contenido Principal - Responsive completo y consistente */}
			<div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
				{/* Header del Dashboard - Responsive completo */}
				<div className="mb-6 sm:mb-8 md:mb-10">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 md:gap-6">
						<div className="text-center sm:text-left">
							<h1 className={`text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold ${
								isDarkMode ? 'text-white' : 'text-gray-900'
							}`}>
								Dashboard
							</h1>
							<p className={`text-sm sm:text-base md:text-lg mt-1 sm:mt-2 ${
								isDarkMode ? 'text-gray-300' : 'text-gray-600'
							}`}>
								Resumen de tu actividad agrícola
							</p>
						</div>
						<button
							onClick={() => setShowActivityModal(true)}
							className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 bg-green-600 text-white rounded-lg sm:rounded-xl hover:bg-green-700 transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base font-medium"
						>
							<Plus className="h-4 w-4 sm:h-5 sm:w-5" />
							<span>Nueva Actividad</span>
						</button>
					</div>
				</div>

				{/* Stats Cards - Grid responsive completo y consistente */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8 md:mb-10">
					{isLoadingDashboard ? (
						// Loading skeleton - Responsive completo
						Array.from({ length: 4 }).map((_, i) => (
							<div key={i} className={`p-4 sm:p-6 rounded-lg sm:rounded-xl shadow-lg border transition-colors duration-300 ${
								isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
							}`}>
								<div className="animate-pulse space-y-3">
									<div className={`h-3 w-20 sm:w-24 rounded ${
										isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
									}`} />
									<div className={`h-5 sm:h-6 w-28 sm:w-32 rounded ${
										isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
									}`} />
								</div>
							</div>
						))
					) : stats ? (
						<>
							{/* Gastos Totales */}
							<div className={`p-4 sm:p-6 rounded-lg sm:rounded-xl shadow-lg border transition-all duration-300 hover:shadow-xl ${
								isDarkMode 
									? 'bg-gray-800 border-gray-700 hover:bg-gray-750' 
									: 'bg-white border-gray-200 hover:bg-gray-50'
							}`}>
								<div className="flex items-center justify-between">
									<div className="flex-1 min-w-0">
										<p className={`text-xs sm:text-sm font-medium ${
											isDarkMode ? 'text-gray-400' : 'text-gray-600'
										}`}>
											Gastos Totales
										</p>
										<p className={`text-lg sm:text-xl lg:text-2xl font-bold ${
											isDarkMode ? 'text-white' : 'text-gray-900'
										} truncate`}>
											{formatCurrency(stats.totalExpenses)}
										</p>
									</div>
									<div className={`p-2 sm:p-3 rounded-lg flex-shrink-0 ${
										isDarkMode ? 'bg-gray-700' : 'bg-green-100'
									}`}>
										<DollarSign className={`h-5 w-5 sm:h-6 sm:w-6 ${
											isDarkMode ? 'text-green-400' : 'text-green-600'
										}`} />
									</div>
								</div>
							</div>

							{/* Gastos Mensuales */}
							<div className={`p-4 sm:p-6 rounded-lg sm:rounded-xl shadow-lg border transition-all duration-300 hover:shadow-xl ${
								isDarkMode 
									? 'bg-gray-800 border-gray-700 hover:bg-gray-750' 
									: 'bg-white border-gray-200 hover:bg-gray-50'
							}`}>
								<div className="flex items-center justify-between">
									<div className="flex-1 min-w-0">
										<p className={`text-xs sm:text-sm font-medium ${
											isDarkMode ? 'text-gray-400' : 'text-gray-600'
										}`}>
											Gastos Mensuales
										</p>
										<p className={`text-lg sm:text-xl lg:text-2xl font-bold ${
											isDarkMode ? 'text-white' : 'text-gray-900'
										} truncate`}>
											{formatCurrency(stats.monthlyExpenses)}
										</p>
									</div>
									<div className={`p-2 sm:p-3 rounded-lg flex-shrink-0 ${
										isDarkMode ? 'bg-gray-700' : 'bg-blue-100'
									}`}>
										<BarChart3 className={`h-5 w-5 sm:h-6 sm:w-6 ${
											isDarkMode ? 'text-blue-400' : 'text-blue-600'
										}`} />
									</div>
								</div>
							</div>

							{/* Actividades */}
							<div className={`p-4 sm:p-6 rounded-lg sm:rounded-xl shadow-lg border transition-all duration-300 hover:shadow-xl ${
								isDarkMode 
									? 'bg-gray-800 border-gray-700 hover:bg-gray-750' 
									: 'bg-white border-gray-200 hover:bg-gray-50'
							}`}>
								<div className="flex items-center justify-between">
									<div className="flex-1 min-w-0">
										<p className={`text-xs sm:text-sm font-medium ${
											isDarkMode ? 'text-gray-400' : 'text-gray-600'
										}`}>
											Actividades
										</p>
										<p className={`text-lg sm:text-xl lg:text-2xl font-bold ${
											isDarkMode ? 'text-white' : 'text-gray-900'
										} truncate`}>
											{stats.activitiesCount}
										</p>
									</div>
									<div className={`p-2 sm:p-3 rounded-lg flex-shrink-0 ${
										isDarkMode ? 'bg-gray-700' : 'bg-purple-100'
									}`}>
										<Calendar className={`h-5 w-5 sm:h-6 sm:w-6 ${
											isDarkMode ? 'text-purple-400' : 'text-purple-600'
										}`} />
									</div>
								</div>
							</div>

							{/* Productos */}
							<div className={`p-4 sm:p-6 rounded-lg sm:rounded-xl shadow-lg border transition-all duration-300 hover:shadow-xl ${
								isDarkMode 
									? 'bg-gray-800 border-gray-700 hover:bg-gray-750' 
									: 'bg-white border-gray-200 hover:bg-gray-50'
							}`}>
								<div className="flex items-center justify-between">
									<div className="flex-1 min-w-0">
										<p className={`text-xs sm:text-sm font-medium ${
											isDarkMode ? 'text-gray-400' : 'text-gray-600'
										}`}>
											Productos
										</p>
										<p className={`text-lg sm:text-xl lg:text-2xl font-bold ${
											isDarkMode ? 'text-white' : 'text-gray-900'
										} truncate`}>
											{stats.productsCount}
										</p>
									</div>
									<div className={`p-2 sm:p-3 rounded-lg flex-shrink-0 ${
										isDarkMode ? 'bg-gray-700' : 'bg-orange-100'
									}`}>
										<Package className={`h-5 w-5 sm:h-6 sm:w-6 ${
											isDarkMode ? 'text-orange-400' : 'text-orange-600'
										}`} />
									</div>
								</div>
							</div>
						</>
					) : (
						// Fallback cuando no hay stats
						<div className="col-span-full text-center py-8 sm:py-12">
							<p className={`${
								isDarkMode ? 'text-gray-400' : 'text-gray-500'
							}`}>
								No hay datos disponibles
							</p>
						</div>
					)}
				</div>

				{/* Cache Status - Responsive */}
				<div className="mb-6 sm:mb-8">
					<CacheStatus className="justify-center" />
				</div>

				{/* Analytics y KPIs - Grid responsive completo */}
				<div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 md:gap-8 mb-6 sm:mb-8 md:mb-10">
					<AnalyticsPanel activities={activities} />
					<ExtendedKPIs activities={activities} />
				</div>

				{/* Sección de Actividades - Responsive completo */}
				<div className={`rounded-lg sm:rounded-xl shadow-lg border overflow-hidden transition-colors duration-300 ${
					isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
			 }`}>
					{/* Header de Actividades - Responsive completo */}
					<div className={`p-4 sm:p-6 border-b transition-colors duration-300 ${
						isDarkMode ? 'border-gray-700' : 'border-gray-200'
					}`}>
						<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 md:gap-6">
							<div className="text-center sm:text-left">
								<h2 className={`text-lg sm:text-xl md:text-2xl font-bold ${
									isDarkMode ? 'text-white' : 'text-gray-900'
								}`}>
									Actividades Recientes
								</h2>
								<p className={`text-sm sm:text-base mt-1 sm:mt-2 ${
									isDarkMode ? 'text-gray-300' : 'text-gray-600'
								}`}>
									Últimas actividades registradas
								</p>
							</div>
							<button
								onClick={() => setShowInventoryModal(true)}
								className={`w-full sm:w-auto flex items-center justify-center space-x-2 px-3 sm:px-4 md:px-6 py-2 sm:py-3 rounded-lg transition-all duration-200 text-sm sm:text-base font-medium ${
									isDarkMode
										? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
										: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
								}`}
							>
								<Package className="h-4 w-4 sm:h-5 sm:w-5" />
								<span>Ver Inventario</span>
							</button>
						</div>
					</div>

					{/* Filtros y Búsqueda - Responsive completo */}
					<div className={`p-4 sm:p-6 border-b transition-colors duration-300 ${
						isDarkMode ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'
					}`}>
						<div className="space-y-4 sm:space-y-6">
							{/* Barra de búsqueda - Responsive completo */}
							<div className="relative">
								<Search className={`absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
									isDarkMode ? 'text-gray-400' : 'text-gray-400'
								}`} />
								<input
									type="text"
									placeholder="Buscar actividades por cultivo o notas..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className={`w-full pl-10 sm:pl-12 pr-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base transition-colors duration-200 ${
										isDarkMode
											? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
											: 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
									}`}
								/>
							</div>
							
							{/* Filtros - Grid responsive completo y consistente */}
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
								<div className="relative">
									<Filter className={`absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
										isDarkMode ? 'text-gray-400' : 'text-gray-400'
									}`} />
									<select
										value={selectedCropType}
										onChange={(e) => setSelectedCropType(e.target.value)}
										className={`w-full pl-10 sm:pl-12 pr-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none text-sm sm:text-base transition-colors duration-200 ${
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
								<div>
									<select
										value={sortKey}
										onChange={(e) => setSortKey(e.target.value as 'date' | 'cost')}
										className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none text-sm sm:text-base transition-colors duration-200 ${
											isDarkMode
												? 'bg-gray-700 border-gray-600 text-white'
												: 'bg-white border-gray-300 text-gray-900'
										}`}
									>
										<option value="date">Ordenar por fecha</option>
										<option value="cost">Ordenar por coste</option>
									</select>
								</div>
							</div>
						</div>
					</div>

					{/* Lista de Actividades - Responsive completo y consistente */}
					<div className="p-4 sm:p-6">
						{/* Estado vacío - Responsive completo */}
						{sortedGroups.length === 0 ? (
							<div className="text-center py-8 sm:py-12">
								<Package className={`h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 sm:mb-6 ${
									isDarkMode ? 'text-gray-500' : 'text-gray-400'
								}`} />
								<p className={`text-base sm:text-lg md:text-xl mb-2 sm:mb-3 ${
									isDarkMode ? 'text-gray-300' : 'text-gray-500'
								}`}>
									No se encontraron actividades
								</p>
								<p className={`text-sm sm:text-base mb-4 sm:mb-6 ${
									isDarkMode ? 'text-gray-400' : 'text-gray-400'
								}`}>
									Crea tu primera actividad para comenzar
								</p>
								<button
									onClick={() => setShowActivityModal(true)}
									className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 text-sm sm:text-base font-medium shadow-lg hover:shadow-xl"
								>
									Crear Actividad
								</button>
							</div>
						) : (
							/* Lista de grupos de actividades - Responsive completo */
							<div className="space-y-4 sm:space-y-6">
								{sortedGroups.map((group) => (
									<div
										key={`${group.cropType}-${group.activities.length}`}
										className={`rounded-lg border transition-colors duration-300 ${
											isDarkMode 
												? 'border-gray-600 bg-gray-750' 
												: 'border-gray-200 bg-gray-50'
										}`}
									>
										{/* Header del Grupo - Responsive completo */}
										<div className={`p-3 sm:p-4 md:p-6 border-b transition-colors duration-300 ${
											isDarkMode 
												? 'border-gray-600 bg-gray-800' 
												: 'border-gray-200 bg-white'
										} rounded-t-lg`}>
											<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 md:gap-6">
												<div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 md:gap-4">
													<span className={`px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm font-medium rounded-full ${getActivityTypeColor(group.cropType)}`}>
														{group.cropType}
													</span>
													<div className="text-center sm:text-left">
														<h3 className={`font-semibold text-sm sm:text-base md:text-lg ${
															isDarkMode ? 'text-white' : 'text-gray-900'
														}`}>
															Actividades de {group.cropType}
														</h3>
														<p className={`text-xs sm:text-sm ${
															isDarkMode ? 'text-gray-400' : 'text-gray-500'
														}`}>
															{group.activities.length} actividad{group.activities.length !== 1 ? 'es' : ''} • 
															{group.firstDate && group.lastDate && (
																` ${formatDate(group.firstDate)} - ${formatDate(group.lastDate)}`
															)}
														</p>
													</div>
												</div>
												<div className="text-center sm:text-right">
													<p className="font-bold text-green-600 text-base sm:text-lg md:text-xl">
														{formatCurrency(group.totalCost)}
													</p>
													<p className={`text-xs sm:text-sm ${
														isDarkMode ? 'text-gray-400' : 'text-gray-500'
													}`}>
														Total del ciclo
													</p>
												</div>
											</div>
										</div>
										
										{/* Actividades del Grupo - Responsive completo */}
										<div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
											{group.activities.map((activity) => (
												<div
													key={activity._id}
													className={`p-3 sm:p-4 md:p-6 rounded-lg border transition-all duration-200 hover:shadow-md ${
														isDarkMode
															? 'border-gray-600 bg-gray-800 hover:bg-gray-750'
															: 'border-gray-200 bg-white hover:bg-gray-50'
													}`}
												>
													<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4 md:gap-6">
														<div className="flex-1">
															<div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 md:gap-4 mb-2 sm:mb-3">
																<span className={`text-xs sm:text-sm ${
																	isDarkMode ? 'text-gray-400' : 'text-gray-500'
																}`}>
																	{formatDate(activity.createdAt)}
																</span>
																{activity.dayNumber && (
																	<span className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium rounded-full bg-blue-100 text-blue-800">
																		Día {activity.dayNumber}
																	</span>
																)}
															</div>
															<h4 className={`font-semibold text-sm sm:text-base md:text-lg mb-2 ${
																isDarkMode ? 'text-white' : 'text-gray-900'
															}`}>
																{activity.cropType}
															</h4>
															{activity.notes && (
																<p className={`text-xs sm:text-sm mb-2 sm:mb-3 ${
																	isDarkMode ? 'text-gray-300' : 'text-gray-600'
																}`}>
																	{activity.notes}
																</p>
															)}
															<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
																<span className="font-semibold text-green-600 text-xs sm:text-sm md:text-base">
																	{formatCurrency(activity.totalCost)}
																</span>
																{activity.location && (
																	<span className={`text-xs sm:text-sm flex items-center space-x-1 sm:space-x-2 ${
																		isDarkMode ? 'text-gray-400' : 'text-gray-500'
																	}`}>
																		<MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
																		<span>Lat: {activity.location.lat.toFixed(4)}, Lng: {activity.location.lng.toFixed(4)}</span>
																	</span>
																)}
															</div>
														</div>
														<div className="flex items-center justify-center sm:justify-end space-x-2">
															<button
																onClick={() => setSelectedActivity(activity)}
																className={`p-2 sm:p-3 rounded-lg transition-all duration-200 ${
																	isDarkMode
																		? 'hover:bg-gray-700 text-gray-300 hover:text-white'
																		: 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
																}`}
																title="Ver detalles"
															>
																<Eye className="h-4 w-4 sm:h-5 sm:w-5" />
															</button>
															<button
																onClick={() => handleActivityDelete(activity._id)}
																className="p-2 sm:p-3 rounded-lg hover:bg-red-50 transition-all duration-200 text-red-500 hover:text-red-700"
																title="Eliminar"
															>
																<Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
															</button>
														</div>
													</div>
												</div>
											))}
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Modales */}
			{/* Modal de confirmación de eliminación */}
			{isConfirmDeleteOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
					<div className={`w-full max-w-md rounded-xl p-6 shadow-2xl transition-colors duration-300 ${
						isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
					}`}>
						<h3 className={`text-lg font-semibold mb-3 ${
							isDarkMode ? 'text-white' : 'text-gray-900'
						}`}>
							Confirmar eliminación
						</h3>
						<p className={`mb-6 ${
							isDarkMode ? 'text-gray-300' : 'text-gray-700'
						}`}>
							Esta acción eliminará la actividad y no se puede deshacer.
						</p>
						<div className="flex justify-end gap-3">
							<button 
								onClick={cancelDelete} 
								className={`px-4 py-2 rounded-lg border transition-all duration-200 ${
									isDarkMode
										? 'border-gray-600 text-gray-300 hover:bg-gray-700'
										: 'border-gray-300 text-gray-700 hover:bg-gray-50'
								}`}
							>
								Cancelar
							</button>
							<button 
								onClick={confirmDelete} 
								className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-all duration-200"
							>
								Eliminar
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Modal de nueva actividad */}
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

			{/* Modal de detalles de actividad */}
			{selectedActivity && (
				<Suspense fallback={<ModalLoadingSpinner />}>
					<ActivityDetailModal
						activity={selectedActivity}
						isOpen={!!selectedActivity}
						onClose={() => setSelectedActivity(null)}
						isDarkMode={isDarkMode}
						onChanged={handleActivityChanged}
					/>
				</Suspense>
			)}

			{/* Modal de inventario */}
			{showInventoryModal && (
				<Suspense fallback={<ModalLoadingSpinner />}>
					<InventoryModal
						isOpen={showInventoryModal}
						onClose={() => setShowInventoryModal(false)}
						isDarkMode={isDarkMode}
					/>
				</Suspense>
			)}
		</div>
	)
}

export default Dashboard