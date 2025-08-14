import React from 'react'

interface StockInfo {
	stock: number
	unit: string
	minStock?: number
	criticalStock?: number
}

interface Props {
	info?: StockInfo | null
	isDarkMode: boolean
}

const StockBadge: React.FC<Props> = ({ info, isDarkMode }) => {
	if (!info) return null
	const level = info.criticalStock != null && info.stock <= info.criticalStock
		? 'critical'
		: (info.minStock != null && info.stock <= info.minStock ? 'low' : 'ok')
	const cls = level === 'critical'
		? 'bg-red-100 text-red-800'
		: level === 'low'
			? 'bg-yellow-100 text-yellow-800'
			: (isDarkMode ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-800')
	return (
		<span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs ${cls}`}>
			Stock: {info.stock} {info.unit}
		</span>
	)
}

export default StockBadge


