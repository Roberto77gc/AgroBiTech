import React from 'react'
import { X, TrendingUp, DollarSign, Calendar, Star } from 'lucide-react'
import { getSupplierStats, getAllPurchases } from '../data/productPrices'

interface SupplierStatsModalProps {
	isOpen: boolean
	onClose: () => void
	isDarkMode: boolean
}

const SupplierStatsModal: React.FC<SupplierStatsModalProps> = ({ 
	isOpen, 
	onClose, 
	isDarkMode 
}) => {
	const supplierStats = getSupplierStats()
	const allPurchases = getAllPurchases()

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('es-ES', {
			style: 'currency',
			currency: 'EUR'
		}).format(amount)
	}

	const formatDate = (timestamp: number) => {
		return new Date(timestamp).toLocaleDateString('es-ES')
	}

	const getTotalSpent = () => {
		return allPurchases.reduce((sum, purchase) => sum + purchase.totalCost, 0)
	}

	const getAveragePurchaseValue = () => {
		return allPurchases.length > 0 ? getTotalSpent() / allPurchases.length : 0
	}

	if (!isOpen) return null

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div className={`relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg shadow-xl ${
				isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
			}`}>
				{/* Header */}
				<div className={`flex items-center justify-between p-6 border-b ${
					isDarkMode ? 'border-gray-700' : 'border-gray-200'
				}`}>
					<div className="flex items-center space-x-3">
						<TrendingUp className="h-6 w-6 text-blue-600" />
						<h2 className="text-xl font-semibold">Análisis de Proveedores y Costes</h2>
					</div>
					<button
						onClick={onClose}
						className={`p-2 rounded-lg transition-colors ${
							isDarkMode 
								? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
								: 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
						}`}
					>
						<X className="h-5 w-5" />
					</button>
				</div>

				{/* Content */}
				<div className="p-6 space-y-6">
					{/* Resumen General */}
					<div className={`p-4 rounded-lg border ${
						isDarkMode ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-50'
					}`}>
						<h3 className="text-lg font-medium mb-4">Resumen General</h3>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div className="text-center">
								<div className="flex items-center justify-center mb-2">
									<DollarSign className="h-8 w-8 text-green-600" />
								</div>
								<p className="text-2xl font-bold text-green-600">
									{formatCurrency(getTotalSpent())}
								</p>
								<p className="text-sm text-gray-500">Total Gastado</p>
							</div>
							<div className="text-center">
								<div className="flex items-center justify-center mb-2">
									<Calendar className="h-8 w-8 text-blue-600" />
								</div>
								<p className="text-2xl font-bold text-blue-600">
									{allPurchases.length}
								</p>
								<p className="text-sm text-gray-500">Compras Realizadas</p>
							</div>
							<div className="text-center">
								<div className="flex items-center justify-center mb-2">
									<TrendingUp className="h-8 w-8 text-purple-600" />
								</div>
								<p className="text-2xl font-bold text-purple-600">
									{formatCurrency(getAveragePurchaseValue())}
								</p>
								<p className="text-sm text-gray-500">Promedio por Compra</p>
							</div>
						</div>
					</div>

					{/* Ranking de Proveedores */}
					<div className={`p-4 rounded-lg border ${
						isDarkMode ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-50'
					}`}>
						<h3 className="text-lg font-medium mb-4">Ranking de Proveedores por Gasto</h3>
						<div className="space-y-3">
							{supplierStats.map((stat, index) => (
								<div key={stat.supplier} className={`p-3 rounded-lg border ${
									isDarkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-white'
								}`}>
									<div className="flex items-center justify-between">
										<div className="flex items-center space-x-3">
											<div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
												index === 0 ? 'bg-yellow-500 text-white' :
												index === 1 ? 'bg-gray-400 text-white' :
												index === 2 ? 'bg-orange-500 text-white' :
												'bg-gray-300 text-gray-700'
											}`}>
												{index + 1}
											</div>
											<div>
												<p className="font-medium">{stat.supplier}</p>
												<div className="flex items-center space-x-4 text-sm text-gray-500">
													<span>{stat.purchaseCount} compras</span>
													<div className="flex items-center space-x-1">
														<Star className="h-4 w-4 text-yellow-500" />
														<span>{stat.averageRating}/5</span>
													</div>
												</div>
											</div>
										</div>
										<div className="text-right">
											<p className="text-lg font-bold text-green-600">
												{formatCurrency(stat.totalSpent)}
											</p>
											<p className="text-sm text-gray-500">
												{stat.lastPurchase ? formatDate(stat.lastPurchase) : 'Sin compras'}
											</p>
										</div>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Análisis de Tendencias */}
					<div className={`p-4 rounded-lg border ${
						isDarkMode ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-50'
					}`}>
						<h3 className="text-lg font-medium mb-4">Análisis de Tendencias</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<h4 className="font-medium mb-2">Proveedor con Mejor Precio</h4>
								{supplierStats.length > 0 && (
									<div className={`p-3 rounded border ${
										isDarkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-white'
									}`}>
										<p className="font-medium">{supplierStats[0].supplier}</p>
										<p className="text-sm text-gray-500">
											{formatCurrency(supplierStats[0].totalSpent)} en {supplierStats[0].purchaseCount} compras
										</p>
									</div>
								)}
							</div>
							<div>
								<h4 className="font-medium mb-2">Proveedor con Mejor Valoración</h4>
								{supplierStats
									.filter(stat => stat.averageRating > 0)
									.sort((a, b) => b.averageRating - a.averageRating)[0] && (
									<div className={`p-3 rounded border ${
										isDarkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-white'
									}`}>
										<p className="font-medium">
											{supplierStats
												.filter(stat => stat.averageRating > 0)
												.sort((a, b) => b.averageRating - a.averageRating)[0].supplier}
										</p>
										<div className="flex items-center space-x-1">
											<Star className="h-4 w-4 text-yellow-500" />
											<span className="text-sm text-gray-500">
												{supplierStats
													.filter(stat => stat.averageRating > 0)
													.sort((a, b) => b.averageRating - a.averageRating)[0].averageRating}/5
											</span>
										</div>
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Recomendaciones */}
					<div className={`p-4 rounded-lg border ${
						isDarkMode ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-50'
					}`}>
						<h3 className="text-lg font-medium mb-4">Recomendaciones</h3>
						<div className="space-y-2 text-sm">
							{supplierStats.length > 0 && (
								<>
									<p className="flex items-center space-x-2">
										<TrendingUp className="h-4 w-4 text-green-600" />
										<span>
											<strong>{supplierStats[0].supplier}</strong> es tu proveedor principal con {formatCurrency(supplierStats[0].totalSpent)} gastados.
										</span>
									</p>
									{supplierStats.filter(stat => stat.averageRating >= 4).length > 0 && (
										<p className="flex items-center space-x-2">
											<Star className="h-4 w-4 text-yellow-500" />
											<span>
												Considera aumentar compras a proveedores con valoración alta (4+ estrellas).
											</span>
										</p>
									)}
									<p className="flex items-center space-x-2">
										<Calendar className="h-4 w-4 text-blue-600" />
										<span>
											Realiza compras regulares para obtener mejores precios por volumen.
										</span>
									</p>
								</>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default SupplierStatsModal 