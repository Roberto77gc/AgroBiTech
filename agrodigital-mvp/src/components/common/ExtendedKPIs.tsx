import React, { useState, useMemo } from 'react'
import { formatCurrencyEUR } from '../../utils/format'

interface ExtendedKPIsProps {
	activities: any[]
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
	const [selectedMetric, setSelectedMetric] = useState<'costPerHa' | 'costPerPlant' | 'efficiency'>('costPerHa')

	const cropBatches = useMemo(() => {
		// Group activities by crop/batch (simplified - using date ranges)
		const batches: CropBatch[] = []
		const processedDates = new Set<string>()

		activities.forEach(activity => {
			const dateKey = activity.date
			if (processedDates.has(dateKey)) return

			// Simulate crop batches based on activity dates
			const batchId = `batch-${dateKey}`
			const area = Math.random() * 10 + 1 // Simulated area between 1-11 ha
			const plants = Math.floor(area * 1000) // Simulated plant density
			
			const totalCost = (activity.fertilizersCost || 0) + 
							(activity.waterCost || 0) + 
							(activity.phytosanitaryCost || 0) + 
							(activity.otherExpensesCost || 0)

			batches.push({
				id: batchId,
				name: `Cultivo ${new Date(activity.date).toLocaleDateString('es-ES', { month: 'short' })}`,
				area,
				plants,
				totalCost,
				startDate: activity.date
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

		// Calculate KPIs
		const costPerHa = totalArea > 0 ? totalCost / totalArea : 0
		const costPerPlant = totalPlants > 0 ? totalCost / totalPlants : 0

		// Calculate efficiency (cost per ha per day)
		const avgDays = cropBatches.length > 0 ? 30 : 0 // Simplified
		const efficiency = avgDays > 0 ? costPerHa / avgDays : 0

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
			? costPerHa * (1 + (costTrend / 100) * 0.1) // 10% of trend
			: costPerHa * (1 + (costTrend / 100) * 0.05) // 5% of trend

		return {
			costPerHa,
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
			case 'costPerHa': return 'Costo por Hectárea'
			case 'costPerPlant': return 'Costo por Planta'
			case 'efficiency': return 'Eficiencia (€/ha/día)'
			default: return ''
		}
	}

	const getMetricValue = (metric: string) => {
		if (!kpiData) return 0
		switch (metric) {
			case 'costPerHa': return kpiData.costPerHa
			case 'costPerPlant': return kpiData.costPerPlant
			case 'efficiency': return kpiData.efficiency
			default: return 0
		}
	}

	const getMetricUnit = (metric: string) => {
		switch (metric) {
			case 'costPerHa': return '€/ha'
			case 'costPerPlant': return '€/planta'
			case 'efficiency': return '€/ha/día'
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
		<div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
			<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
				KPIs Extendidos
			</h3>

			{/* Metric Selector */}
			<div className="flex gap-2 mb-6">
				{(['costPerHa', 'costPerPlant', 'efficiency'] as const).map((metric) => (
					<button
						key={metric}
						onClick={() => setSelectedMetric(metric)}
						className={`px-4 py-2 text-sm rounded-md transition-colors ${
							selectedMetric === metric
								? 'bg-blue-600 text-white'
								: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
						}`}
					>
						{getMetricLabel(metric)}
					</button>
				))}
			</div>

			{/* Main KPI Display */}
			<div className="text-center mb-8">
				<div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
					{getMetricLabel(selectedMetric)}
				</div>
				<div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
					{formatCurrencyEUR(getMetricValue(selectedMetric))}
				</div>
				<div className="text-sm text-gray-500 dark:text-gray-400">
					{getMetricUnit(selectedMetric)}
				</div>
			</div>

			{/* Summary Grid */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
				<div className="text-center">
					<div className="text-sm text-gray-600 dark:text-gray-400">Área Total</div>
					<div className="text-lg font-semibold text-gray-900 dark:text-white">
						{kpiData.totalArea.toFixed(1)} ha
					</div>
				</div>
				<div className="text-center">
					<div className="text-sm text-gray-600 dark:text-gray-400">Plantas</div>
					<div className="text-lg font-semibold text-gray-900 dark:text-white">
						{kpiData.totalPlants.toLocaleString()}
					</div>
				</div>
				<div className="text-center">
					<div className="text-sm text-gray-600 dark:text-gray-400">Costo Total</div>
					<div className="text-lg font-semibold text-gray-900 dark:text-white">
						{formatCurrencyEUR(kpiData.totalCost)}
					</div>
				</div>
				<div className="text-center">
					<div className="text-sm text-gray-600 dark:text-gray-400">Tendencia</div>
					<div className={`text-lg font-semibold flex items-center justify-center gap-1 ${
						kpiData.costTrend > 0 ? 'text-red-600' : 'text-green-600'
					}`}>
						<span>{kpiData.costTrend > 0 ? '↗' : '↘'}</span>
						{Math.abs(kpiData.costTrend).toFixed(1)}%
					</div>
				</div>
			</div>

			{/* Prediction */}
			<div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
				<h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
					Predicción Simple
				</h4>
				<div className="text-sm text-blue-700 dark:text-blue-300">
					Basado en la tendencia actual, el costo por hectárea podría ser{' '}
					<span className="font-semibold">
						{formatCurrencyEUR(kpiData.prediction)}
					</span>{' '}
					en el próximo período.
				</div>
			</div>

			{/* Top Batches */}
			<div className="mt-6">
				<h4 className="font-medium text-gray-900 dark:text-white mb-3">
					Rendimiento por Lote
				</h4>
				<div className="space-y-2">
					{cropBatches.slice(0, 5).map((batch) => (
						<div key={batch.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
							<div>
								<div className="font-medium text-gray-900 dark:text-white">
									{batch.name}
								</div>
								<div className="text-sm text-gray-600 dark:text-gray-400">
									{batch.area.toFixed(1)} ha • {batch.plants.toLocaleString()} plantas
								</div>
							</div>
							<div className="text-right">
								<div className="font-semibold text-gray-900 dark:text-white">
									{formatCurrencyEUR(batch.totalCost)}
								</div>
								<div className="text-sm text-gray-600 dark:text-gray-400">
									{formatCurrencyEUR(batch.totalCost / batch.area)}/ha
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
