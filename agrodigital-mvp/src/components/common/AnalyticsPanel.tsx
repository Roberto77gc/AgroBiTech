import React, { useState, useMemo } from 'react'
import { formatCurrencyEUR } from '../../utils/format'

interface AnalyticsPanelProps {
	activities: Array<{
		createdAt?: string | Date
		totalCost?: number
		fertigation?: { enabled?: boolean; dailyRecords?: Array<{ totalCost?: number; date?: string }>}
		phytosanitary?: { enabled?: boolean; dailyRecords?: Array<{ totalCost?: number; date?: string }>}
		water?: { enabled?: boolean; dailyRecords?: Array<{ cost?: number; date?: string }>}
		notes?: string
		name?: string
		date?: string | Date
	}>
	className?: string
}

interface TimeRange {
	label: string
	days: number
}

interface AnalyticsData {
	totalCost: number
	averageDailyCost: number
	costByCategory: { fertilizers: number; water: number; phytosanitary: number; others: number }
	costTrend: Array<{ date: string; cost: number }>
	percentageChange: number
}

const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ activities, className = '' }) => {
	const [selectedRange, setSelectedRange] = useState<number>(30)

	const timeRanges: TimeRange[] = [
		{ label: '7 días', days: 7 },
		{ label: '30 días', days: 30 },
		{ label: '90 días', days: 90 }
	]

	const filteredActivities = useMemo(() => {
		const cutoffDate = new Date()
		cutoffDate.setDate(cutoffDate.getDate() - selectedRange)
		return activities.filter(activity => {
			const raw = (activity as any).date ?? activity.createdAt
			const activityDate = new Date(raw as any)
			return !isNaN(activityDate.getTime()) && activityDate >= cutoffDate
		})
	}, [activities, selectedRange])

	const analytics = useMemo((): AnalyticsData => {
		if (filteredActivities.length === 0) {
			return {
				totalCost: 0,
				averageDailyCost: 0,
				costByCategory: { fertilizers: 0, water: 0, phytosanitary: 0, others: 0 },
				costTrend: [],
				percentageChange: 0
			}
		}

		// Derivar costes por categoría a partir de sub-módulos por actividad
		const costByCategory: { fertilizers: number; water: number; phytosanitary: number; others: number } = filteredActivities.reduce((acc, activity: any) => {
			const fertRecords = activity?.fertigation?.dailyRecords || []
			const fertCost = fertRecords.reduce((s: number, r: any) => s + Number(r?.totalCost || 0), 0)
			acc.fertilizers += fertCost

			const waterRecords = activity?.water?.dailyRecords || []
			const waterCost = waterRecords.reduce((s: number, r: any) => s + Number(r?.cost || 0), 0)
			acc.water += waterCost

			const phytoRecords = activity?.phytosanitary?.dailyRecords || []
			const phytoCost = phytoRecords.reduce((s: number, r: any) => s + Number(r?.totalCost || 0), 0)
			acc.phytosanitary += phytoCost

			const total = Number(activity?.totalCost || 0)
			const derivedSum = fertCost + waterCost + phytoCost
			const others = Math.max(0, total - derivedSum)
			acc.others += others
			return acc
		}, { fertilizers: 0, water: 0, phytosanitary: 0, others: 0 })

		const totalCost = Object.values(costByCategory).reduce((sum: number, cost: number) => sum + cost, 0)
		const averageDailyCost = totalCost / filteredActivities.length

		// Calculate cost trend (last 7 data points)
		const costTrend = filteredActivities
			.slice(-7)
			.map(activity => {
				const raw = (activity as any).date ?? (activity as any).createdAt
				const label = new Date(raw as any).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })
				return { date: label, cost: Number((activity as any).totalCost || 0) }
			})

		// Calculate percentage change from previous period
		const previousRange = selectedRange * 2
		const previousCutoff = new Date()
		previousCutoff.setDate(previousCutoff.getDate() - previousRange)
		
		const previousActivities = activities.filter(activity => {
			const raw = (activity as any).date ?? (activity as any).createdAt
			const activityDate = new Date(raw as any)
			const cutoffDate = new Date()
			cutoffDate.setDate(cutoffDate.getDate() - selectedRange)
			return activityDate >= previousCutoff && activityDate < cutoffDate
		})

		const previousTotalCost = previousActivities.reduce((sum: number, activity: any) => sum + Number(activity.totalCost || 0), 0)

		const percentageChange = previousTotalCost > 0 
			? ((totalCost - previousTotalCost) / previousTotalCost) * 100 
			: 0

		return {
			totalCost,
			averageDailyCost,
			costByCategory,
			costTrend,
			percentageChange
		}
	}, [filteredActivities, activities, selectedRange])

	const getPercentageChangeColor = (change: number) => {
		if (change > 0) return 'text-red-600'
		if (change < 0) return 'text-green-600'
		return 'text-gray-600'
	}

	const getPercentageChangeIcon = (change: number) => {
		if (change > 0) return '↗'
		if (change < 0) return '↘'
		return '→'
	}

	return (
		<div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 ${className}`}>
			{/* Header */}
			<div className="mb-6">
				<h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4">
					Analíticas por Rango
				</h3>
				
				{/* Time Range Selector - Responsive */}
				<div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
					{timeRanges.map((range) => (
						<button
							key={range.days}
							onClick={() => setSelectedRange(range.days)}
							className={`px-3 sm:px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
								selectedRange === range.days
									? 'bg-blue-600 text-white shadow-md'
									: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
							}`}
						>
							{range.label}
						</button>
					))}
				</div>
			</div>

			{filteredActivities.length === 0 ? (
				<div className="text-center py-8 text-gray-500 dark:text-gray-400">
					No hay datos para el período seleccionado
				</div>
			) : (
				<div className="space-y-4 sm:space-y-6">
					{/* Summary Cards - Responsive Grid */}
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
						<div className="bg-blue-50 dark:bg-blue-900/20 p-3 sm:p-4 rounded-lg">
							<div className="text-xs sm:text-sm text-blue-600 dark:text-blue-400">Costo Total</div>
							<div className="text-lg sm:text-2xl font-bold text-blue-900 dark:text-blue-100">
								{formatCurrencyEUR(analytics.totalCost)}
							</div>
						</div>
						<div className="bg-green-50 dark:bg-green-900/20 p-3 sm:p-4 rounded-lg">
							<div className="text-xs sm:text-sm text-green-600 dark:text-green-400">Costo Promedio/Día</div>
							<div className="text-lg sm:text-2xl font-bold text-green-900 dark:text-green-100">
								{formatCurrencyEUR(analytics.averageDailyCost)}
							</div>
						</div>
						<div className="bg-purple-50 dark:bg-purple-900/20 p-3 sm:p-4 rounded-lg sm:col-span-2 lg:col-span-1">
							<div className="text-xs sm:text-sm text-purple-600 dark:text-purple-400">Variación</div>
							<div className={`text-lg sm:text-2xl font-bold flex items-center gap-1 ${getPercentageChangeColor(analytics.percentageChange)}`}>
								<span>{getPercentageChangeIcon(analytics.percentageChange)}</span>
								{Math.abs(analytics.percentageChange).toFixed(1)}%
							</div>
						</div>
					</div>

					{/* Cost Breakdown - Responsive Grid */}
					<div className="bg-gray-50 dark:bg-gray-700/50 p-3 sm:p-4 rounded-lg">
						<h4 className="font-medium text-gray-900 dark:text-white mb-3 text-sm sm:text-base">Desglose por Categoría</h4>
						<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
							{Object.entries(analytics.costByCategory).map(([category, cost]) => {
								const percentage = analytics.totalCost > 0 ? (cost / analytics.totalCost) * 100 : 0
								const categoryLabels = {
									fertilizers: 'Fertilizantes',
									water: 'Agua',
									phytosanitary: 'Fitosanitarios',
									others: 'Otros'
								}
								
								return (
									<div key={category} className="text-center">
										<div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
											{categoryLabels[category as keyof typeof categoryLabels]}
										</div>
										<div className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-white">
											{formatCurrencyEUR(cost)}
										</div>
										<div className="text-xs text-gray-500 dark:text-gray-400">
											{percentage.toFixed(1)}%
										</div>
									</div>
								)
							})}
						</div>
					</div>

					{/* Cost Trend - Responsive */}
					<div className="bg-gray-50 dark:bg-gray-700/50 p-3 sm:p-4 rounded-lg">
						<h4 className="font-medium text-gray-900 dark:text-white mb-3 text-sm sm:text-base">Tendencia de Costos (Últimos 7 días)</h4>
						<div className="flex items-end justify-between h-24 sm:h-32 gap-1 sm:gap-2">
							{analytics.costTrend.map((point, index) => {
								const maxCost = Math.max(...analytics.costTrend.map(p => p.cost))
								const height = maxCost > 0 ? (point.cost / maxCost) * 100 : 0
								
								return (
									<div key={index} className="flex-1 flex flex-col items-center">
										<div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
											{point.date}
										</div>
										<div 
											className="w-full bg-blue-500 rounded-t transition-all duration-300"
											style={{ height: `${height}%` }}
										/>
										<div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
											{formatCurrencyEUR(point.cost)}
										</div>
									</div>
								)
							})}
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

export default AnalyticsPanel
