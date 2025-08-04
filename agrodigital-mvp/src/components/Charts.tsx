import React from 'react'
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	BarElement,
	ArcElement,
	Title,
	Tooltip,
	Legend,
	Filler
} from 'chart.js'
import { Line, Bar, Doughnut } from 'react-chartjs-2'

// Registrar componentes de Chart.js
ChartJS.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	BarElement,
	ArcElement,
	Title,
	Tooltip,
	Legend,
	Filler
)

interface ExpenseData {
	month: string
	amount: number
}

interface CategoryData {
	category: string
	amount: number
	percentage: number
}

interface ChartProps {
	isDarkMode: boolean
}

// Gráfico de línea - Gastos mensuales
export const ExpenseLineChart: React.FC<ChartProps & { data: ExpenseData[] }> = ({ 
	isDarkMode, 
	data 
}) => {
	const chartData = {
		labels: data.map(item => item.month),
		datasets: [
			{
				label: 'Gastos Mensuales',
				data: data.map(item => item.amount),
				borderColor: isDarkMode ? '#10b981' : '#059669',
				backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(5, 150, 105, 0.1)',
				fill: true,
				tension: 0.4,
				pointBackgroundColor: isDarkMode ? '#10b981' : '#059669',
				pointBorderColor: isDarkMode ? '#ffffff' : '#ffffff',
				pointBorderWidth: 2,
				pointRadius: 4,
				pointHoverRadius: 6
			}
		]
	}

	const options = {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: {
				display: false
			},
			tooltip: {
				backgroundColor: isDarkMode ? '#374151' : '#ffffff',
				titleColor: isDarkMode ? '#ffffff' : '#111827',
				bodyColor: isDarkMode ? '#d1d5db' : '#374151',
				borderColor: isDarkMode ? '#4b5563' : '#e5e7eb',
				borderWidth: 1,
				callbacks: {
					label: function(context: any) {
						return `€${context.parsed.y.toFixed(2)}`
					}
				}
			}
		},
		scales: {
			x: {
				grid: {
					color: isDarkMode ? '#374151' : '#e5e7eb',
					display: false
				},
				ticks: {
					color: isDarkMode ? '#9ca3af' : '#6b7280',
					font: {
						size: 12
					}
				}
			},
			y: {
				grid: {
					color: isDarkMode ? '#374151' : '#e5e7eb',
					borderDash: [5, 5]
				},
				ticks: {
					color: isDarkMode ? '#9ca3af' : '#6b7280',
					font: {
						size: 12
					},
					callback: function(value: any) {
						return `€${value}`
					}
				}
			}
		}
	}

	return (
		<div className="h-64">
			<Line data={chartData} options={options} />
		</div>
	)
}

// Gráfico de barras - Gastos por categoría
export const CategoryBarChart: React.FC<ChartProps & { data: CategoryData[] }> = ({ 
	isDarkMode, 
	data 
}) => {
	const colors = [
		'#10b981', // Verde
		'#3b82f6', // Azul
		'#f59e0b', // Amarillo
		'#ef4444', // Rojo
		'#8b5cf6', // Púrpura
		'#06b6d4', // Cian
		'#f97316', // Naranja
		'#ec4899'  // Rosa
	]

	const chartData = {
		labels: data.map(item => item.category),
		datasets: [
			{
				label: 'Gastos por Categoría',
				data: data.map(item => item.amount),
				backgroundColor: colors.slice(0, data.length),
				borderColor: colors.slice(0, data.length),
				borderWidth: 1,
				borderRadius: 4,
				borderSkipped: false
			}
		]
	}

	const options = {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: {
				display: false
			},
			tooltip: {
				backgroundColor: isDarkMode ? '#374151' : '#ffffff',
				titleColor: isDarkMode ? '#ffffff' : '#111827',
				bodyColor: isDarkMode ? '#d1d5db' : '#374151',
				borderColor: isDarkMode ? '#4b5563' : '#e5e7eb',
				borderWidth: 1,
				callbacks: {
					label: function(context: any) {
						const dataIndex = context.dataIndex
						const percentage = data[dataIndex]?.percentage || 0
						return `${context.parsed.y.toFixed(2)}€ (${percentage}%)`
					}
				}
			}
		},
		scales: {
			x: {
				grid: {
					color: isDarkMode ? '#374151' : '#e5e7eb',
					display: false
				},
				ticks: {
					color: isDarkMode ? '#9ca3af' : '#6b7280',
					font: {
						size: 11
					},
					maxRotation: 45
				}
			},
			y: {
				grid: {
					color: isDarkMode ? '#374151' : '#e5e7eb',
					borderDash: [5, 5]
				},
				ticks: {
					color: isDarkMode ? '#9ca3af' : '#6b7280',
					font: {
						size: 12
					},
					callback: function(value: any) {
						return `€${value}`
					}
				}
			}
		}
	}

	return (
		<div className="h-64">
			<Bar data={chartData} options={options} />
		</div>
	)
}

// Gráfico de dona - Distribución de inventario
export const InventoryDoughnutChart: React.FC<ChartProps & { data: CategoryData[] }> = ({ 
	isDarkMode, 
	data 
}) => {
	const colors = [
		'#10b981', // Verde
		'#3b82f6', // Azul
		'#f59e0b', // Amarillo
		'#ef4444', // Rojo
		'#8b5cf6', // Púrpura
		'#06b6d4', // Cian
		'#f97316'  // Naranja
	]

	const chartData = {
		labels: data.map(item => item.category),
		datasets: [
			{
				data: data.map(item => item.amount),
				backgroundColor: colors.slice(0, data.length),
				borderColor: isDarkMode ? '#374151' : '#ffffff',
				borderWidth: 2,
				hoverOffset: 4
			}
		]
	}

	const options = {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: {
				position: 'bottom' as const,
				labels: {
					color: isDarkMode ? '#d1d5db' : '#374151',
					font: {
						size: 12
					},
					padding: 15,
					usePointStyle: true,
					pointStyle: 'circle'
				}
			},
			tooltip: {
				backgroundColor: isDarkMode ? '#374151' : '#ffffff',
				titleColor: isDarkMode ? '#ffffff' : '#111827',
				bodyColor: isDarkMode ? '#d1d5db' : '#374151',
				borderColor: isDarkMode ? '#4b5563' : '#e5e7eb',
				borderWidth: 1,
				callbacks: {
					label: function(context: any) {
						const dataIndex = context.dataIndex
						const percentage = data[dataIndex]?.percentage || 0
						return `${context.label}: €${context.parsed.toFixed(2)} (${percentage}%)`
					}
				}
			}
		}
	}

	return (
		<div className="h-64">
			<Doughnut data={chartData} options={options} />
		</div>
	)
}

// Gráfico de progreso - Objetivos mensuales
export const ProgressChart: React.FC<ChartProps & { 
	current: number; 
	target: number; 
	label: string;
	unit: string;
}> = ({ isDarkMode, current, target, label, unit }) => {
	const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0
	const isOverTarget = current > target

	return (
		<div className={`p-4 rounded-lg ${
			isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
		}`}>
			<div className="flex items-center justify-between mb-3">
				<h3 className={`font-medium text-sm ${
					isDarkMode ? 'text-gray-300' : 'text-gray-700'
				}`}>
					{label}
				</h3>
				<span className={`text-sm font-medium ${
					isOverTarget ? 'text-red-500' : 'text-green-500'
				}`}>
					{percentage.toFixed(1)}%
				</span>
			</div>
			
			<div className="relative">
				<div className={`w-full h-2 rounded-full ${
					isDarkMode ? 'bg-gray-600' : 'bg-gray-200'
				}`}>
					<div 
						className={`h-2 rounded-full transition-all duration-500 ${
							isOverTarget ? 'bg-red-500' : 'bg-green-500'
						}`}
						style={{ width: `${Math.min(percentage, 100)}%` }}
					></div>
				</div>
			</div>
			
			<div className="flex justify-between mt-2 text-xs">
				<span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
					{current} {unit}
				</span>
				<span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
					{target} {unit}
				</span>
			</div>
		</div>
	)
}

// Widget de métricas rápidas
export const MetricsWidget: React.FC<ChartProps & {
	title: string
	value: string | number
	subtitle: string
	trend?: 'up' | 'down' | 'neutral'
	trendValue?: string
	icon: React.ReactNode
}> = ({ isDarkMode, title, value, subtitle, trend, trendValue, icon }) => {
	const getTrendColor = () => {
		if (trend === 'up') return 'text-green-500'
		if (trend === 'down') return 'text-red-500'
		return 'text-gray-500'
	}

	const getTrendIcon = () => {
		if (trend === 'up') return '↗'
		if (trend === 'down') return '↘'
		return '→'
	}

	return (
		<div className={`p-4 rounded-lg border transition-colors ${
			isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
		}`}>
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-3">
					<div className={`p-2 rounded-lg ${
						isDarkMode ? 'bg-gray-600' : 'bg-gray-100'
					}`}>
						{icon}
					</div>
					<div>
						<p className={`text-sm font-medium ${
							isDarkMode ? 'text-gray-300' : 'text-gray-600'
						}`}>
							{title}
						</p>
						<p className={`text-2xl font-bold ${
							isDarkMode ? 'text-white' : 'text-gray-900'
						}`}>
							{value}
						</p>
					</div>
				</div>
				{trend && (
					<div className={`text-right ${getTrendColor()}`}>
						<div className="text-lg font-bold">{getTrendIcon()}</div>
						<div className="text-xs">{trendValue}</div>
					</div>
				)}
			</div>
			<p className={`text-xs mt-2 ${
				isDarkMode ? 'text-gray-400' : 'text-gray-500'
			}`}>
				{subtitle}
			</p>
		</div>
	)
} 