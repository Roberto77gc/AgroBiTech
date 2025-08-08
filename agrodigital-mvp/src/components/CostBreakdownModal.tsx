import React from 'react'
import { X, Euro, Leaf, Shield, Droplets, Package } from 'lucide-react'

interface CostBreakdownModalProps {
	isOpen: boolean
	onClose: () => void
	activityName: string
	date: string
	costs: {
		fertilizers: { name: string; amount: number; unit: string; price: number; cost: number }[]
		phytosanitaries: { name: string; amount: number; unit: string; price: number; cost: number }[]
		water: { consumption: number; unit: string; price: number; cost: number }
		others: { name: string; amount: number; unit: string; price: number; cost: number }[]
	}
	isDarkMode: boolean
}

const CostBreakdownModal: React.FC<CostBreakdownModalProps> = ({
	isOpen,
	onClose,
	activityName,
	date,
	costs,
	isDarkMode
}) => {
	if (!isOpen) return null

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('es-ES', {
			style: 'currency',
			currency: 'EUR'
		}).format(amount)
	}

	const calculateCategoryTotal = (items: any[]) => {
		return items.reduce((sum, item) => sum + (item.cost || 0), 0)
	}

	const fertilizersTotal = calculateCategoryTotal(costs.fertilizers)
	const phytosanitariesTotal = calculateCategoryTotal(costs.phytosanitaries)
	const waterTotal = costs.water.cost || 0
	const othersTotal = calculateCategoryTotal(costs.others)
	const totalCost = fertilizersTotal + phytosanitariesTotal + waterTotal + othersTotal

	const getCategoryIcon = (category: string) => {
		switch (category) {
			case 'fertilizers': return <Leaf className="h-5 w-5" />
			case 'phytosanitaries': return <Shield className="h-5 w-5" />
			case 'water': return <Droplets className="h-5 w-5" />
			case 'others': return <Package className="h-5 w-5" />
			default: return <Euro className="h-5 w-5" />
		}
	}

	const getCategoryColor = (category: string) => {
		switch (category) {
			case 'fertilizers': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300'
			case 'phytosanitaries': return 'text-orange-600 bg-orange-100 dark:bg-orange-900 dark:text-orange-300'
			case 'water': return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300'
			case 'others': return 'text-purple-600 bg-purple-100 dark:bg-purple-900 dark:text-purple-300'
			default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-300'
		}
	}

	const getCategoryName = (category: string) => {
		switch (category) {
			case 'fertilizers': return 'Fertilizantes'
			case 'phytosanitaries': return 'Fitosanitarios'
			case 'water': return 'Agua'
			case 'others': return 'Otros'
			default: return 'Otros'
		}
	}

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl shadow-xl transition-colors ${
				isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
			}`}>
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
					<div>
						<h2 className="text-xl font-bold flex items-center space-x-2">
							<Euro className="h-6 w-6 text-green-600" />
							<span>Desglose de Gastos</span>
						</h2>
						<p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
							{activityName} - {new Date(date).toLocaleDateString('es-ES', {
								year: 'numeric',
								month: 'long',
								day: 'numeric'
							})}
						</p>
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
				<div className="p-6 space-y-6">
					{/* Resumen Total */}
					<div className={`p-4 rounded-lg border-2 ${
						isDarkMode ? 'bg-gray-700 border-green-500' : 'bg-green-50 border-green-200'
					}`}>
						<div className="flex items-center justify-between">
							<div className="flex items-center space-x-3">
								<Euro className="h-8 w-8 text-green-600" />
								<div>
									<h3 className="text-lg font-bold">Gasto Total del Día</h3>
									<p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
										Resumen de todos los gastos
									</p>
								</div>
							</div>
							<div className="text-right">
								<div className="text-2xl font-bold text-green-600">
									{formatCurrency(totalCost)}
								</div>
								<div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
									Total del día
								</div>
							</div>
						</div>
					</div>

					{/* Desglose por Categorías */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{/* Fertilizantes */}
						{fertilizersTotal > 0 && (
							<div className={`p-4 rounded-lg border ${
								isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
							}`}>
								<div className="flex items-center justify-between mb-3">
									<div className="flex items-center space-x-2">
										<div className={`p-2 rounded-lg ${getCategoryColor('fertilizers')}`}>
											{getCategoryIcon('fertilizers')}
										</div>
										<div>
											<h4 className="font-semibold">{getCategoryName('fertilizers')}</h4>
											<p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
												{costs.fertilizers.length} producto(s)
											</p>
										</div>
									</div>
									<div className="text-right">
										<div className="text-lg font-bold text-green-600">
											{formatCurrency(fertilizersTotal)}
										</div>
									</div>
								</div>
								<div className="space-y-2">
									{costs.fertilizers.map((item, index) => (
										<div key={index} className={`p-2 rounded ${
											isDarkMode ? 'bg-gray-600' : 'bg-gray-50'
										}`}>
											<div className="flex justify-between items-center">
												<span className="text-sm font-medium">{item.name}</span>
												<span className="text-sm">{formatCurrency(item.cost)}</span>
											</div>
											<div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
												{item.amount} {item.unit} × {formatCurrency(item.price)}/{item.unit}
											</div>
										</div>
									))}
								</div>
							</div>
						)}

						{/* Fitosanitarios */}
						{phytosanitariesTotal > 0 && (
							<div className={`p-4 rounded-lg border ${
								isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
							}`}>
								<div className="flex items-center justify-between mb-3">
									<div className="flex items-center space-x-2">
										<div className={`p-2 rounded-lg ${getCategoryColor('phytosanitaries')}`}>
											{getCategoryIcon('phytosanitaries')}
										</div>
										<div>
											<h4 className="font-semibold">{getCategoryName('phytosanitaries')}</h4>
											<p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
												{costs.phytosanitaries.length} producto(s)
											</p>
										</div>
									</div>
									<div className="text-right">
										<div className="text-lg font-bold text-orange-600">
											{formatCurrency(phytosanitariesTotal)}
										</div>
									</div>
								</div>
								<div className="space-y-2">
									{costs.phytosanitaries.map((item, index) => (
										<div key={index} className={`p-2 rounded ${
											isDarkMode ? 'bg-gray-600' : 'bg-gray-50'
										}`}>
											<div className="flex justify-between items-center">
												<span className="text-sm font-medium">{item.name}</span>
												<span className="text-sm">{formatCurrency(item.cost)}</span>
											</div>
											<div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
												{item.amount} {item.unit} × {formatCurrency(item.price)}/{item.unit}
											</div>
										</div>
									))}
								</div>
							</div>
						)}

						{/* Agua */}
						{waterTotal > 0 && (
							<div className={`p-4 rounded-lg border ${
								isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
							}`}>
								<div className="flex items-center justify-between mb-3">
									<div className="flex items-center space-x-2">
										<div className={`p-2 rounded-lg ${getCategoryColor('water')}`}>
											{getCategoryIcon('water')}
										</div>
										<div>
											<h4 className="font-semibold">{getCategoryName('water')}</h4>
											<p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
												Consumo de riego
											</p>
										</div>
									</div>
									<div className="text-right">
										<div className="text-lg font-bold text-blue-600">
											{formatCurrency(waterTotal)}
										</div>
									</div>
								</div>
								<div className={`p-2 rounded ${isDarkMode ? 'bg-gray-600' : 'bg-gray-50'}`}>
									<div className="flex justify-between items-center">
										<span className="text-sm font-medium">Consumo de agua</span>
										<span className="text-sm">{formatCurrency(waterTotal)}</span>
									</div>
									<div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
										{costs.water.consumption} {costs.water.unit} × {formatCurrency(costs.water.price)}/{costs.water.unit}
									</div>
								</div>
							</div>
						)}

						{/* Otros */}
						{othersTotal > 0 && (
							<div className={`p-4 rounded-lg border ${
								isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
							}`}>
								<div className="flex items-center justify-between mb-3">
									<div className="flex items-center space-x-2">
										<div className={`p-2 rounded-lg ${getCategoryColor('others')}`}>
											{getCategoryIcon('others')}
										</div>
										<div>
											<h4 className="font-semibold">{getCategoryName('others')}</h4>
											<p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
												Gastos adicionales
											</p>
										</div>
									</div>
									<div className="text-right">
										<div className="text-lg font-bold text-purple-600">
											{formatCurrency(othersTotal)}
										</div>
									</div>
								</div>
								<div className="space-y-2">
									{costs.others.map((item, index) => (
										<div key={index} className={`p-2 rounded ${
											isDarkMode ? 'bg-gray-600' : 'bg-gray-50'
										}`}>
											<div className="flex justify-between items-center">
												<span className="text-sm font-medium">{item.name}</span>
												<span className="text-sm">{formatCurrency(item.cost)}</span>
											</div>
											<div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
												{item.amount} {item.unit} × {formatCurrency(item.price)}/{item.unit}
											</div>
										</div>
									))}
								</div>
							</div>
						)}
					</div>

					{/* Sin gastos */}
					{totalCost === 0 && (
						<div className={`p-8 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
							<Euro className="h-12 w-12 mx-auto mb-4 opacity-50" />
							<p className="text-lg font-medium">No hay gastos registrados</p>
							<p className="text-sm">Añade productos o consumo para ver el desglose de gastos</p>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

export default CostBreakdownModal
