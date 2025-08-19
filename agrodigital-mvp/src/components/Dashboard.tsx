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
	LogOut,
	Menu,
	X,
	Smartphone,
	Tablet,
	Monitor
} from 'lucide-react'
import { useToast } from './ui/ToastProvider'
import { formatCurrencyEUR } from '../utils/format'
import { activityAPI, dashboardAPI } from '../services/api'
import type { Activity as ActivityType } from '../types'
import CacheStatus from './common/CacheStatus'
import AnalyticsPanel from './common/AnalyticsPanel'
import ExtendedKPIs from './common/ExtendedKPIs'
import NotificationSystem from './ui/NotificationSystem'
import { useSmartNotifications } from '../hooks/useSmartNotifications'
import OfflineStatus from './ui/OfflineStatus'
import { useOfflineMode } from '../hooks/useOfflineMode'

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
    const { success: toastSuccess, error: toastError } = useToast()
    const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
        try { return localStorage.getItem('darkMode') === 'true' } catch { return false }
    })
    const [activities, setActivities] = useState<ActivityType[]>([])
    const [stats, setStats] = useState<any>(null)
    const [isLoadingDashboard, setIsLoadingDashboard] = useState<boolean>(false)
    const [searchTerm, setSearchTerm] = useState<string>(() => {
        try { return localStorage.getItem('dash:search') || '' } catch { return '' }
    })
    const [selectedCropType, setSelectedCropType] = useState<string>(() => {
        try { return localStorage.getItem('dash:crop') || 'all' } catch { return 'all' }
    })
    const [sortKey, setSortKey] = useState<'date' | 'cost'>(() => {
        try { return (localStorage.getItem('dash:sort') as 'date' | 'cost') || 'date' } catch { return 'date' }
    })
	const [showActivityModal, setShowActivityModal] = useState(false)
	const [selectedActivity, setSelectedActivity] = useState<ActivityType | null>(null)
	const [showInventoryModal, setShowInventoryModal] = useState(false)
	const [showProductModal, setShowProductModal] = useState(false)
	const [showSupplierModal, setShowSupplierModal] = useState(false)
	const [showPurchaseModal, setShowPurchaseModal] = useState(false)
	const [showSupplierStatsModal, setShowSupplierStatsModal] = useState(false)
  	const [confirmDeleteActivityId, setConfirmDeleteActivityId] = useState<string | null>(null)
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false)
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
	const [currentBreakpoint, setCurrentBreakpoint] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')

	// Initialize smart notifications
	useSmartNotifications()
	const offlineMode = useOfflineMode()

	useEffect(() => {
		loadDashboardData()
    const onChanged = () => loadDashboardData()
    window.addEventListener('app:data-changed', onChanged as EventListener)
    return () => window.removeEventListener('app:data-changed', onChanged as EventListener)
	}, [])

	// Responsive breakpoint detection
	useEffect(() => {
		const handleResize = () => {
			const width = window.innerWidth
			if (width < 768) {
				setCurrentBreakpoint('mobile')
			} else if (width < 1024) {
				setCurrentBreakpoint('tablet')
			} else {
				setCurrentBreakpoint('desktop')
			}
		}

		handleResize()
		window.addEventListener('resize', handleResize)
		return () => window.removeEventListener('resize', handleResize)
	}, [])

	// Abrir Inventario automáticamente si la URL contiene ?productId=... o ruta /inventario
	useEffect(() => {
		const checkOpenInventory = () => {
			try {
				const url = new URL(window.location.href)
				const hasPid = !!url.searchParams.get('productId')
				const isInventoryPath = url.pathname.includes('inventario') || url.hash.includes('inventario')
				if (hasPid || isInventoryPath) {
					setShowInventoryModal(true)
				}
			} catch {}
		}
		checkOpenInventory()
		window.addEventListener('popstate', checkOpenInventory)
		window.addEventListener('hashchange', checkOpenInventory)
		return () => {
			window.removeEventListener('popstate', checkOpenInventory)
			window.removeEventListener('hashchange', checkOpenInventory)
		}
	}, [])

    useEffect(() => {
        // Aplicar y persistir modo oscuro
        if (isDarkMode) {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
        try { localStorage.setItem('darkMode', String(isDarkMode)) } catch {}
    }, [isDarkMode])

    // Persistir filtros/búsqueda/orden
    useEffect(() => {
        try { localStorage.setItem('dash:search', searchTerm) } catch {}
    }, [searchTerm])
    useEffect(() => {
        try { localStorage.setItem('dash:crop', selectedCropType) } catch {}
    }, [selectedCropType])
    useEffect(() => {
        try { localStorage.setItem('dash:sort', sortKey) } catch {}
    }, [sortKey])

	const loadDashboardData = async () => {
    try {
            setIsLoadingDashboard(true)
            const data = await dashboardAPI.stats()
            setStats(data.stats)
            setActivities(data.recentActivities || [])
		} catch (error) {
			console.error('Error loading dashboard data:', error)
			toastError('Error al cargar los datos del dashboard')
    } finally { setIsLoadingDashboard(false) }
	}

	const handleActivitySubmit = async (activityData: any) => {
		try {
            const response = await activityAPI.create(activityData)
            if (response?.success !== false) {
				toastSuccess('Actividad creada exitosamente')
				setShowActivityModal(false)
				loadDashboardData()
			} else {
				toastError('Error al crear la actividad')
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
      if (response?.success !== false) {
        toastSuccess('Actividad eliminada exitosamente')
        loadDashboardData()
      } else {
        toastError('Error al eliminar la actividad')
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
        if (sortKey === 'cost') {
            return (b.totalCost || 0) - (a.totalCost || 0)
        }
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

    const formatCurrency = (amount: number) => formatCurrencyEUR(Number(amount))

	return (
		<div className={`min-h-screen transition-colors ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
			{/* Header */}
			<header className={`sticky top-0 z-40 border-b transition-colors ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-between h-16">
						{/* Logo and Mobile Menu Button */}
						<div className="flex items-center">
							{/* Mobile Menu Button */}
							<button
								onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
								className="lg:hidden p-2 rounded-lg transition-colors mr-3"
							>
								{isMobileMenuOpen ? (
									<X className="h-6 w-6" />
								) : (
									<Menu className="h-6 w-6" />
								)}
							</button>
							
							<h1 className="text-xl font-bold text-green-600">AgroDigital</h1>
							
							{/* Breakpoint Indicator (debug) */}
							<div className="ml-3 flex items-center gap-1 text-xs opacity-60">
								{currentBreakpoint === 'mobile' && <Smartphone className="h-3 w-3" />}
								{currentBreakpoint === 'tablet' && <Tablet className="h-3 w-3" />}
								{currentBreakpoint === 'desktop' && <Monitor className="h-3 w-3" />}
							</div>
						</div>

						{/* Header Actions */}
						<div className="flex items-center space-x-2 sm:space-x-4">
							{/* Notifications */}
							<NotificationSystem />
							
							{/* Offline Status */}
							<OfflineStatus className="mr-2" />
							
							{/* Dark Mode Toggle */}
							<button
								onClick={() => setIsDarkMode(!isDarkMode)}
								className={`p-2 rounded-lg transition-colors ${
									isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
								}`}
							>
								{isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
							</button>
							
							{/* User Info and Logout */}
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

			{/* Mobile Menu Overlay */}
			{isMobileMenuOpen && (
				<div className="lg:hidden fixed inset-0 z-50">
					{/* Backdrop */}
					<div 
						className="absolute inset-0 bg-black bg-opacity-50"
						onClick={() => setIsMobileMenuOpen(false)}
					/>
					
					{/* Menu Panel */}
					<div className={`absolute left-0 top-0 h-full w-80 max-w-[85vw] transform transition-transform ${
						isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
					} ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
						<div className="p-6">
							<div className="flex items-center justify-between mb-6">
								<h2 className="text-lg font-semibold">Menú</h2>
								<button
									onClick={() => setIsMobileMenuOpen(false)}
									className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
								>
									<X className="h-5 w-5" />
								</button>
							</div>
							
							{/* Navigation Links */}
							<div className="space-y-4">
								<div>
									<h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
										GESTIÓN
									</h3>
									<div className="space-y-2">
										<button
											onClick={() => {
												setShowActivityModal(true)
												setIsMobileMenuOpen(false)
											}}
											className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
										>
											Nueva Actividad
										</button>
										<button
											onClick={() => {
												setShowInventoryModal(true)
												setIsMobileMenuOpen(false)
											}}
											className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
										>
											Inventario
										</button>
									</div>
								</div>
								
								<div>
									<h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
										ACCIONES RÁPIDAS
									</h3>
									<div className="space-y-2">
										<button
											onClick={() => {
												setShowProductModal(true)
												setIsMobileMenuOpen(false)
											}}
											className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
										>
											Productos
										</button>
										<button
											onClick={() => {
												setShowSupplierModal(true)
												setIsMobileMenuOpen(false)
											}}
											className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
										>
											Proveedores
										</button>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Sidebar - Hidden on mobile, shown on larger screens */}
				<div className="flex flex-col lg:flex-row gap-8">
					<div className="hidden lg:block lg:w-64 flex-shrink-0">
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
                            {isLoadingDashboard && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                                    {Array.from({ length: 4 }).map((_, i) => (
                                        <div key={i} className={`p-4 sm:p-6 rounded-xl shadow-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                                            <div className="animate-pulse space-y-3">
                                                <div className="h-3 w-24 rounded bg-gray-300 dark:bg-gray-600" />
                                                <div className="h-6 w-32 rounded bg-gray-200 dark:bg-gray-700" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {stats && !isLoadingDashboard && (
								<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
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

							{/* Cache Status */}
							<div className="mb-6">
								<CacheStatus className="justify-center" />
							</div>

										{/* Analytics and Extended KPIs - Responsive Grid */}
			<div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mb-6">
				<AnalyticsPanel activities={activities} />
				<ExtendedKPIs activities={activities} />
			</div>

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
									{/* Search and Filter - Enhanced Responsive */}
                                    <div className="space-y-4 mb-6">
										{/* Search Bar - Full width on mobile */}
										<div className="w-full">
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
										
										{/* Filters Row - Stack on mobile, row on larger screens */}
										<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
											<div className="w-full">
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
											<div className="w-full">
												<select
													value={sortKey}
													onChange={(e) => setSortKey(e.target.value as 'date' | 'cost')}
													className={`w-full px-4 py-2 border rounded-lg transition-colors ${
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
			{isConfirmDeleteOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
					<div className={`w-full max-w-md rounded-lg p-6 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
						<h3 className="text-lg font-semibold mb-2">Confirmar eliminación</h3>
						<p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-4`}>Esta acción eliminará la actividad y no se puede deshacer.</p>
						<div className="flex justify-end gap-2">
							<button onClick={cancelDelete} className={`px-4 py-2 rounded border ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>Cancelar</button>
							<button onClick={confirmDelete} className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700">Eliminar</button>
						</div>
					</div>
				</div>
			)}
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
              onChanged={handleActivityChanged}
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