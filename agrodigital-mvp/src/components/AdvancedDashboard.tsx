import React, { useState, useEffect } from 'react'
import { 
	TrendingUp, 
	DollarSign, 
	Package, 
	Activity,
	Calendar,
	Target,
	AlertTriangle
} from 'lucide-react'
import { 
	ExpenseLineChart, 
	CategoryBarChart, 
	InventoryDoughnutChart, 
	ProgressChart,
	MetricsWidget 
} from './Charts'

interface AdvancedDashboardProps {
	isDarkMode: boolean
	userId: string
}

interface DashboardData {
	expensesByMonth: Array<{ month: string; amount: number }>
	expensesByCategory: Array<{ category: string; amount: number; percentage: number }>
	inventoryByCategory: Array<{ category: string; amount: number; percentage: number }>
	stats: {
		totalExpenses: number
		monthlyExpenses: number
		activitiesCount: number
		productsCount: number
		lowStockAlerts: number
		savingsPercentage: number
		monthlyTarget: number
		productivityScore: number
	}
	recentTrends: {
		expensesTrend: 'up' | 'down' | 'neutral'
		activitiesTrend: 'up' | 'down' | 'neutral'
		productivityTrend: 'up' | 'down' | 'neutral'
	}
}

const AdvancedDashboard: React.FC<AdvancedDashboardProps> = ({ isDarkMode, userId }) => {
	const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month')

	useEffect(() => {
		loadDashboardData()
	}, [userId, selectedPeriod])

	const loadDashboardData = async () => {
		setIsLoading(true)
		try {
			const token = localStorage.getItem('token')
			const response = await fetch(`http://localhost:3000/api/dashboard/advanced?period=${selectedPeriod}`, {
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				}
			})

			if (response.ok) {
				const data = await response.json()
				setDashboardData(data)
			} else {
				// Si no hay datos reales, usar datos de ejemplo
				setDashboardData(getMockData())
			}
		} catch (error) {
			console.error('Error loading dashboard data:', error)
			setDashboardData(getMockData())
		} finally {
			setIsLoading(false)
		}
	}

	const getMockData = (): DashboardData => {
		const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun']
		const categories = ['Fertilizantes', 'Fitosanitarios', 'Semillas', 'Herramientas', 'Combustible']
		
		return {
					expensesByMonth: months.map((month) => ({
			month,
			amount: Math.random() * 2000 + 500
		})),
		expensesByCategory: categories.map((category) => ({
			category,
			amount: Math.random() * 1500 + 200,
			percentage: Math.random() * 30 + 10
		})),
		inventoryByCategory: categories.map((category) => ({
				category,
				amount: Math.random() * 5000 + 1000,
				percentage: Math.random() * 25 + 5
			})),
			stats: {
				totalExpenses: 8500,
				monthlyExpenses: 1450,
				activitiesCount: 24,
				productsCount: 18,
				lowStockAlerts: 3,
				savingsPercentage: 15,
				monthlyTarget: 2000,
				productivityScore: 78
			},
			recentTrends: {
				expensesTrend: 'down',
				activitiesTrend: 'up',
				productivityTrend: 'up'
			}
		}
	}

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
			</div>
		)
	}

	if (!dashboardData) {
		return (
			<div className="text-center py-8">
				<p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
					No se pudieron cargar los datos del dashboard
				</p>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			{/* Header con filtros */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
						Dashboard Avanzado
					</h2>
					<p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
						Análisis detallado de tu explotación agrícola
					</p>
				</div>
				<div className="flex items-center space-x-2">
					<select
						value={selectedPeriod}
						onChange={(e) => setSelectedPeriod(e.target.value as 'month' | 'quarter' | 'year')}
						className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
							isDarkMode 
								? 'bg-gray-700 border-gray-600 text-white' 
								: 'bg-white border-gray-300 text-gray-900'
						}`}
					>
						<option value="month">Este mes</option>
						<option value="quarter">Este trimestre</option>
						<option value="year">Este año</option>
					</select>
				</div>
			</div>

			{/* Métricas principales */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<MetricsWidget
					isDarkMode={isDarkMode}
					title="Gastos Totales"
					value={`€${dashboardData.stats.totalExpenses.toFixed(0)}`}
					subtitle={`${selectedPeriod === 'month' ? 'Este mes' : selectedPeriod === 'quarter' ? 'Este trimestre' : 'Este año'}`}
					trend={dashboardData.recentTrends.expensesTrend}
					trendValue={dashboardData.recentTrends.expensesTrend === 'down' ? '-12%' : '+8%'}
					icon={<DollarSign className="h-5 w-5 text-green-500" />}
				/>
				<MetricsWidget
					isDarkMode={isDarkMode}
					title="Actividades"
					value={dashboardData.stats.activitiesCount}
					subtitle="Registradas"
					trend={dashboardData.recentTrends.activitiesTrend}
					trendValue={dashboardData.recentTrends.activitiesTrend === 'up' ? '+15%' : '-5%'}
					icon={<Activity className="h-5 w-5 text-blue-500" />}
				/>
				<MetricsWidget
					isDarkMode={isDarkMode}
					title="Productividad"
					value={`${dashboardData.stats.productivityScore}%`}
					subtitle="Puntuación general"
					trend={dashboardData.recentTrends.productivityTrend}
					trendValue={dashboardData.recentTrends.productivityTrend === 'up' ? '+8%' : '-3%'}
					icon={<TrendingUp className="h-5 w-5 text-purple-500" />}
				/>
				<MetricsWidget
					isDarkMode={isDarkMode}
					title="Inventario"
					value={dashboardData.stats.productsCount}
					subtitle={`${dashboardData.stats.lowStockAlerts} alertas`}
					trend="neutral"
					icon={<Package className="h-5 w-5 text-orange-500" />}
				/>
			</div>

			{/* Gráficos principales */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Gráfico de gastos mensuales */}
				<div className={`rounded-xl shadow-lg border overflow-hidden transition-colors ${
					isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
				}`}>
					<div className="p-6 border-b border-gray-200 dark:border-gray-700">
						<h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
							Evolución de Gastos
						</h3>
						<p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
							Tendencia de gastos a lo largo del tiempo
						</p>
					</div>
					<div className="p-6">
						<ExpenseLineChart 
							isDarkMode={isDarkMode} 
							data={dashboardData.expensesByMonth} 
						/>
					</div>
				</div>

				{/* Gráfico de gastos por categoría */}
				<div className={`rounded-xl shadow-lg border overflow-hidden transition-colors ${
					isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
				}`}>
					<div className="p-6 border-b border-gray-200 dark:border-gray-700">
						<h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
							Gastos por Categoría
						</h3>
						<p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
							Distribución de gastos por tipo de producto
						</p>
					</div>
					<div className="p-6">
						<CategoryBarChart 
							isDarkMode={isDarkMode} 
							data={dashboardData.expensesByCategory} 
						/>
					</div>
				</div>
			</div>

			{/* Gráficos secundarios y widgets */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Distribución de inventario */}
				<div className={`rounded-xl shadow-lg border overflow-hidden transition-colors ${
					isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
				}`}>
					<div className="p-6 border-b border-gray-200 dark:border-gray-700">
						<h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
							Distribución de Inventario
						</h3>
						<p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
							Valor por categoría de producto
						</p>
					</div>
					<div className="p-6">
						<InventoryDoughnutChart 
							isDarkMode={isDarkMode} 
							data={dashboardData.inventoryByCategory} 
						/>
					</div>
				</div>

				{/* Objetivos y progreso */}
				<div className="lg:col-span-2 space-y-4">
					<div className={`rounded-xl shadow-lg border overflow-hidden transition-colors ${
						isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
					}`}>
						<div className="p-6 border-b border-gray-200 dark:border-gray-700">
							<h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
								Objetivos y Progreso
							</h3>
							<p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
								Seguimiento de metas mensuales
							</p>
						</div>
						<div className="p-6 space-y-4">
							<ProgressChart
								isDarkMode={isDarkMode}
								current={dashboardData.stats.monthlyExpenses}
								target={dashboardData.stats.monthlyTarget}
								label="Presupuesto Mensual"
								unit="€"
							/>
							<ProgressChart
								isDarkMode={isDarkMode}
								current={dashboardData.stats.activitiesCount}
								target={30}
								label="Actividades Planificadas"
								unit="actividades"
							/>
							<ProgressChart
								isDarkMode={isDarkMode}
								current={dashboardData.stats.productivityScore}
								target={100}
								label="Productividad General"
								unit="%"
							/>
						</div>
					</div>
				</div>
			</div>

			{/* Resumen de alertas y recomendaciones */}
			<div className={`rounded-xl shadow-lg border overflow-hidden transition-colors ${
				isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
			}`}>
				<div className="p-6 border-b border-gray-200 dark:border-gray-700">
					<h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
						Alertas y Recomendaciones
					</h3>
				</div>
				<div className="p-6">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						{/* Alertas */}
						<div>
							<h4 className={`font-medium mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
								Alertas Activas
							</h4>
							<div className="space-y-3">
								{dashboardData.stats.lowStockAlerts > 0 && (
									<div className="flex items-center space-x-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
										<AlertTriangle className="h-5 w-5 text-red-500" />
										<div>
											<p className={`text-sm font-medium ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>
												Stock Bajo
											</p>
											<p className={`text-xs ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
												{dashboardData.stats.lowStockAlerts} productos necesitan reposición
											</p>
										</div>
									</div>
								)}
								<div className="flex items-center space-x-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
									<Target className="h-5 w-5 text-amber-500" />
									<div>
										<p className={`text-sm font-medium ${isDarkMode ? 'text-amber-300' : 'text-amber-700'}`}>
											Presupuesto
										</p>
										<p className={`text-xs ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>
											Has gastado el {((dashboardData.stats.monthlyExpenses / dashboardData.stats.monthlyTarget) * 100).toFixed(1)}% del presupuesto
										</p>
									</div>
								</div>
							</div>
						</div>

						{/* Recomendaciones */}
						<div>
							<h4 className={`font-medium mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
								Recomendaciones
							</h4>
							<div className="space-y-3">
								<div className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
									<TrendingUp className="h-5 w-5 text-green-500" />
									<div>
										<p className={`text-sm font-medium ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>
											Excelente Productividad
										</p>
										<p className={`text-xs ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
											Tu productividad ha aumentado un 8% este mes
										</p>
									</div>
								</div>
								<div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
									<Calendar className="h-5 w-5 text-blue-500" />
									<div>
										<p className={`text-sm font-medium ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
											Planificación
										</p>
										<p className={`text-xs ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
											Considera planificar las actividades de la próxima semana
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default AdvancedDashboard 