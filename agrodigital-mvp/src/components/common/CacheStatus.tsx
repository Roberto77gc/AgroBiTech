import React from 'react'
import { inventoryCache, productCache, statsCache } from '../../utils/cache'

interface CacheStatusProps {
	className?: string
}

const CacheStatus: React.FC<CacheStatusProps> = ({ className = '' }) => {
	const [inventoryState, setInventoryState] = React.useState<'fresh' | 'stale' | 'expired' | 'validating' | 'none'>('none')
	const [productState, setProductState] = React.useState<'fresh' | 'stale' | 'expired' | 'validating' | 'none'>('none')
	const [statsState, setStatsState] = React.useState<'fresh' | 'stale' | 'expired' | 'validating' | 'none'>('none')

	React.useEffect(() => {
		const updateStates = () => {
			setInventoryState(inventoryCache.getState('inventory'))
			setProductState(productCache.getState('products'))
			setStatsState(statsCache.getState('stats'))
		}

		updateStates()
		const interval = setInterval(updateStates, 1000)
		return () => clearInterval(interval)
	}, [])

	const getStateColor = (state: string) => {
		switch (state) {
			case 'fresh': return 'text-green-600 bg-green-100'
			case 'stale': return 'text-yellow-600 bg-yellow-100'
			case 'expired': return 'text-red-600 bg-red-100'
			case 'validating': return 'text-blue-600 bg-blue-100'
			default: return 'text-gray-600 bg-gray-100'
		}
	}

	const getStateIcon = (state: string) => {
		switch (state) {
			case 'fresh': return '✓'
			case 'stale': return '⚠'
			case 'expired': return '✗'
			case 'validating': return '⟳'
			default: return '○'
		}
	}



	return (
		<div className={`flex gap-2 text-xs ${className}`}>
			<div className={`px-2 py-1 rounded-full flex items-center gap-1 ${getStateColor(inventoryState)}`}>
				<span className="font-bold">{getStateIcon(inventoryState)}</span>
				<span>Inventario</span>
			</div>
			<div className={`px-2 py-1 rounded-full flex items-center gap-1 ${getStateColor(productState)}`}>
				<span className="font-bold">{getStateIcon(productState)}</span>
				<span>Productos</span>
			</div>
			<div className={`px-2 py-1 rounded-full flex items-center gap-1 ${getStateColor(statsState)}`}>
				<span className="font-bold">{getStateIcon(statsState)}</span>
				<span>Estadísticas</span>
			</div>
		</div>
	)
}

export default CacheStatus
