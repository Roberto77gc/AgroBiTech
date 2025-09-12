import React, { useState, useMemo } from 'react'
import { formatCurrencyEUR } from '../../utils/format'
import { convertArea, formatArea, calculateCostPerM2 } from '../../utils/conversions'

interface ExtendedKPIsProps {
	activities: Array<{
		area?: number
		plantCount?: number
		totalCost?: number
		createdAt?: string | Date
		name?: string
		date?: string | Date
	}>
	className?: string
}

interface CropBatch {
	id: string
	name: string
	area: number
	plants: number
	totalCost: number
	startDate: string
}

const ExtendedKPIs: React.FC<ExtendedKPIsProps> = ({ activities, className = '' }) => {
	const [selectedMetric, setSelectedMetric] = useState<'costPerM2' | 'costPerPlant' | 'efficiency'>('costPerM2')

	const cropBatches = useMemo(() => {
		// Group activities by crop/batch (simplified - using date ranges)
		const batches: CropBatch[] = []
		const processedDates = new Set<string>()

		activities.forEach(activity => {
			const dateKey = (activity as any).date ?? activity.createdAt
			if (processedDates.has(dateKey)) return

			// Usar datos reales si existen; fallback simple si faltan
			const batchId = `batch-${dateKey}`
			const area = Number(activity.area ?? 0)
			const plants = Number(activity.plantCount ?? 0)
			
			const totalCost = Number(activity.totalCost || 0)

			batches.push({
				id: batchId,
				name: String(activity.name || `Actividad ${new Date(dateKey as any).toLocaleDateString('es-ES', { month: 'short' })}`),
				area,
				plants,
				totalCost,
				startDate: String(dateKey)
			})

			processedDates.add(dateKey)
		})

		return batches.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
	}, [activities])

	const kpiData = useMemo(() => {
		if (cropBatches.length === 0) return null

		const totalArea = cropBatches.reduce((sum, batch) => sum + batch.area, 0)
		const totalPlants = cropBatches.reduce((sum, batch) => sum + batch.plants, 0)
		const totalCost = cropBatches.reduce((sum, batch) => sum + batch.totalCost, 0)

		// Calculate KPIs - convertir área a m² para cálculos
		const totalAreaM2 = convertArea(totalArea, 'ha', 'm²')
		const costPerM2 = calculateCostPerM2(totalCost, totalAreaM2)
		const costPerPlant = totalPlants > 0 ? totalCost / totalPlants : 0

		// Calculate efficiency (cost per m² per day)
		const avgDays = cropBatches.length > 0 ? 30 : 0 // Simplified
		const efficiency = avgDays > 0 ? costPerM2 / avgDays : 0

		// Calculate trends
		const recentBatches = cropBatches.slice(0, 3)
		const olderBatches = cropBatches.slice(3, 6)
		
		const recentAvgCost = recentBatches.length > 0 
			? recentBatches.reduce((sum, b) => sum + b.totalCost / b.area, 0) / recentBatches.length 
			: 0
		const olderAvgCost = olderBatches.length > 0 
			? olderBatches.reduce((sum, b) => sum + b.totalCost / b.area, 0) / olderBatches.length 
			: 0

		const costTrend = olderAvgCost > 0 
			? ((recentAvgCost - olderAvgCost) / olderAvgCost) * 100 
			: 0

		// Simple prediction (linear trend)
		const prediction = costTrend > 0 
			? costPerM2 * (1 + (costTrend / 100) * 0.1) // 10% of trend
			: costPerM2 * (1 + (costTrend / 100) * 0.05) // 5% of trend

		return {
			costPerM2,
			costPerPlant,
			efficiency,
			costTrend,
			prediction,
			totalArea,
			totalPlants,
			totalCost
		}
	}, [cropBatches])

	const getMetricLabel = (metric: string) => {
		switch (metric) {
			case 'costPerM2': return 'Costo por m²'
			case 'costPerPlant': return 'Costo por Planta'
			case 'efficiency': return 'Eficiencia (€/m²/día)'
			default: return ''
		}
	}

	const getMetricValue = (metric: string) => {
		if (!kpiData) return 0
		switch (metric) {
			case 'costPerM2': return kpiData.costPerM2
			case 'costPerPlant': return kpiData.costPerPlant
			case 'efficiency': return kpiData.efficiency
			default: return 0
		}
	}

	const getMetricUnit = (metric: string) => {
		switch (metric) {
			case 'costPerM2': return '€/m²'
			case 'costPerPlant': return '€/planta'
			case 'efficiency': return '€/m²/día'
			default: return ''
		}
	}

	if (!kpiData) {
		return (
			<div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
				<div className="text-center py-8 text-gray-500 dark:text-gray-400">
					No hay datos suficientes para calcular KPIs
				</div>
			</div>
		)
	}

	return (
		<div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 ${className}`}>
			{/* Header */}
			<div className="mb-6">
				<h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4">
					KPIs Extendidos
				</h3>
				
				{/* Metric Selector - Responsive */}
				<div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
					{(['costPerM2', 'costPerPlant', 'efficiency'] as const).map((metric) => (
						<button
							key={metric}
							onClick={() => setSelectedMetric(metric)}
							className={`px-3 sm:px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
								selectedMetric === metric
									? 'bg-blue-600 text-white shadow-md'
									: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
							}`}
						>
							{getMetricLabel(metric)}
						</button>
					))}
				</div>
			</div>

			{/* Main KPI Display - Responsive */}
			<div className="text-center mb-6 sm:mb-8">
				<div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2">
					{getMetricLabel(selectedMetric)}
				</div>
				<div className="text-2xl sm:text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
					{formatCurrencyEUR(getMetricValue(selectedMetric))}
				</div>
				<div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
					{getMetricUnit(selectedMetric)}
				</div>
			</div>

			{/* Summary Grid - Responsive */}
			<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
				<div className="text-center">
					<div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Área Total</div>
					<div className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-white">
						{formatArea(kpiData.totalArea, 'ha', 0)}
					</div>
				</div>
				<div className="text-center">
					<div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Plantas</div>
					<div className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-white">
						{kpiData.totalPlants.toLocaleString()}
					</div>
				</div>
				<div className="text-center">
					<div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Costo Total</div>
					<div className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-white">
						{formatCurrencyEUR(kpiData.totalCost)}
					</div>
				</div>
				<div className="text-center">
					<div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Tendencia</div>
					<div className={`text-sm sm:text-lg font-semibold flex items-center justify-center gap-1 ${
						kpiData.costTrend > 0 ? 'text-red-600' : 'text-green-600'
					}`}>
						<span>{kpiData.costTrend > 0 ? '↗' : '↘'}</span>
						{Math.abs(kpiData.costTrend).toFixed(1)}%
					</div>
				</div>
			</div>

			{/* Prediction - Responsive */}
			<div className="bg-blue-50 dark:bg-blue-900/20 p-3 sm:p-4 rounded-lg">
				<h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2 text-sm sm:text-base">
					Predicción Simple
				</h4>
				<div className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">
					Basado en la tendencia actual, el costo por m² podría ser{' '}
					<span className="font-semibold">
						{formatCurrencyEUR(kpiData.prediction)}
					</span>{' '}
					en el próximo período.
				</div>
			</div>

			{/* Top Batches - Responsive */}
			<div className="mt-4 sm:mt-6">
				<h4 className="font-medium text-gray-900 dark:text-white mb-3 text-sm sm:text-base">
					Rendimiento por Lote
				</h4>
				<div className="space-y-2">
					{cropBatches.slice(0, 5).map((batch) => (
						<div key={batch.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg gap-2 sm:gap-0">
							<div className="flex-1">
								<div className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">
									{batch.name}
								</div>
								<div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
									{formatArea(batch.area, 'ha', 0)} • {batch.plants.toLocaleString()} plantas
								</div>
							</div>
							<div className="text-left sm:text-right">
								<div className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
									{formatCurrencyEUR(batch.totalCost)}
								</div>
								<div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
									{formatCurrencyEUR(calculateCostPerM2(batch.totalCost, convertArea(batch.area, 'ha', 'm²')))}/m²
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	)
}

export default ExtendedKPIs
