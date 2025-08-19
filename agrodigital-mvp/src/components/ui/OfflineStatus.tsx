import React, { useState } from 'react'
import { 
	Wifi, 
	WifiOff, 
	Cloud, 
	RefreshCw, 
	Database, 
	AlertTriangle,
	CheckCircle,
	X,
	Info,
	Settings,
	Trash2
} from 'lucide-react'
import { useOfflineMode } from '../../hooks/useOfflineMode'

interface OfflineStatusProps {
	className?: string
	showDetails?: boolean
}

const OfflineStatus: React.FC<OfflineStatusProps> = ({ 
	className = '',
	showDetails = false 
}) => {
	const [isExpanded, setIsExpanded] = useState(showDetails)
	const [showSettings, setShowSettings] = useState(false)
	
	const {
		isOnline,
		hasPendingSync,
		syncProgress,
		storageStats,
		forceSync,
		clearAllData,
		clearExpiredCache,
		removeSyncedData,
		// checkNetworkQuality removed as it's not being used
		lastSyncAttempt,
		isSyncInProgress,
		canSync
	} = useOfflineMode()

	const formatBytes = (bytes: number): string => {
		if (bytes === 0) return '0 B'
		const k = 1024
		const sizes = ['B', 'KB', 'MB', 'GB']
		const i = Math.floor(Math.log(bytes) / Math.log(k))
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
	}

	const formatTimeAgo = (timestamp: number): string => {
		if (timestamp === 0) return 'Nunca'
		
		const now = Date.now()
		const diff = now - timestamp
		const minutes = Math.floor(diff / 60000)
		const hours = Math.floor(diff / 3600000)
		const days = Math.floor(diff / 86400000)

		if (days > 0) return `Hace ${days} día${days > 1 ? 's' : ''}`
		if (hours > 0) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`
		if (minutes > 0) return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`
		return 'Hace un momento'
	}

	const getStatusColor = () => {
		if (!isOnline) return 'text-red-500'
		if (hasPendingSync) return 'text-yellow-500'
		return 'text-green-500'
	}

	const getStatusIcon = () => {
		if (!isOnline) return <WifiOff className="h-4 w-4" />
		if (hasPendingSync) return <AlertTriangle className="h-4 w-4" />
		return <CheckCircle className="h-4 w-4" />
	}

	// Network quality check removed as it's not being used

	const handleSync = async () => {
		if (canSync) {
			await forceSync()
		}
	}

	const handleClearAll = async () => {
		if (window.confirm('¿Estás seguro de que quieres eliminar todos los datos offline? Esta acción no se puede deshacer.')) {
			await clearAllData()
		}
	}

	const handleClearExpired = async () => {
		await clearExpiredCache()
	}

	const handleRemoveSynced = async () => {
		if (window.confirm('¿Eliminar datos ya sincronizados? Esto liberará espacio pero mantendrá los datos pendientes.')) {
			await removeSyncedData()
		}
	}

	return (
		<div className={`${className}`}>
			{/* Main Status Bar */}
			<div className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
				isOnline 
					? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
					: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
			}`}>
				<div className="flex items-center space-x-3">
					<div className={`flex items-center space-x-2 ${getStatusColor()}`}>
						{getStatusIcon()}
						<span className="text-sm font-medium">
							{isOnline ? 'En línea' : 'Sin conexión'}
						</span>
					</div>
					
					{isOnline && (
						<div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
							<Wifi className="h-3 w-3" />
							<span className="text-xs">
								{hasPendingSync ? `${storageStats.pendingItems} pendiente${storageStats.pendingItems !== 1 ? 's' : ''}` : 'Sincronizado'}
							</span>
						</div>
					)}
				</div>

				<div className="flex items-center space-x-2">
					{isOnline && hasPendingSync && (
						<button
							onClick={handleSync}
							disabled={!canSync}
							className={`flex items-center space-x-1 px-2 py-1 text-xs rounded transition-colors ${
								canSync 
									? 'bg-blue-500 text-white hover:bg-blue-600' 
									: 'bg-gray-300 text-gray-500 cursor-not-allowed'
							}`}
						>
							<RefreshCw className={`h-3 w-3 ${isSyncInProgress ? 'animate-spin' : ''}`} />
							<span>Sincronizar</span>
						</button>
					)}

					<button
						onClick={() => setIsExpanded(!isExpanded)}
						className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
					>
						{isExpanded ? <X className="h-4 w-4" /> : <Info className="h-4 w-4" />}
					</button>
				</div>
			</div>

			{/* Expanded Details */}
			{isExpanded && (
				<div className="mt-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
					{/* Sync Progress */}
					{isSyncInProgress && (
						<div className="mb-4">
							<div className="flex items-center justify-between mb-2">
								<span className="text-sm font-medium text-gray-700 dark:text-gray-300">
									Sincronizando...
								</span>
								<span className="text-sm text-gray-500">
									{syncProgress}%
								</span>
							</div>
							<div className="w-full bg-gray-200 rounded-full h-2">
								<div 
									className="bg-blue-500 h-2 rounded-full transition-all duration-300"
									style={{ width: `${syncProgress}%` }}
								/>
							</div>
						</div>
					)}

					{/* Storage Statistics */}
					<div className="grid grid-cols-2 gap-4 mb-4">
						<div className="text-center p-3 bg-white dark:bg-gray-700 rounded-lg border">
							<div className="text-2xl font-bold text-blue-600">
								{storageStats.totalItems}
							</div>
							<div className="text-xs text-gray-500">Total</div>
						</div>
						<div className="text-center p-3 bg-white dark:bg-gray-700 rounded-lg border">
							<div className="text-2xl font-bold text-green-600">
								{storageStats.syncedItems}
							</div>
							<div className="text-xs text-gray-500">Sincronizados</div>
						</div>
						<div className="text-center p-3 bg-white dark:bg-gray-700 rounded-lg border">
							<div className="text-2xl font-bold text-yellow-600">
								{storageStats.pendingItems}
							</div>
							<div className="text-xs text-gray-500">Pendientes</div>
						</div>
						<div className="text-center p-3 bg-white dark:bg-gray-700 rounded-lg border">
							<div className="text-sm font-bold text-purple-600">
								{formatBytes(storageStats.storageSize)}
							</div>
							<div className="text-xs text-gray-500">Almacenamiento</div>
						</div>
					</div>

					{/* Last Sync Info */}
					{lastSyncAttempt > 0 && (
						<div className="mb-4 p-3 bg-white dark:bg-gray-700 rounded-lg border">
							<div className="flex items-center justify-between">
								<span className="text-sm text-gray-600 dark:text-gray-400">
									Última sincronización:
								</span>
								<span className="text-sm font-medium">
									{formatTimeAgo(lastSyncAttempt)}
								</span>
							</div>
						</div>
					)}

					{/* Action Buttons */}
					<div className="flex flex-wrap gap-2">
						<button
							onClick={handleSync}
							disabled={!canSync}
							className={`flex items-center space-x-2 px-3 py-2 text-sm rounded transition-colors ${
								canSync 
									? 'bg-blue-500 text-white hover:bg-blue-600' 
									: 'bg-gray-300 text-gray-500 cursor-not-allowed'
							}`}
						>
							<RefreshCw className="h-4 w-4" />
							<span>Sincronizar Ahora</span>
						</button>

						<button
							onClick={handleClearExpired}
							className="flex items-center space-x-2 px-3 py-2 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
						>
							<Database className="h-4 w-4" />
							<span>Limpiar Cache</span>
						</button>

						<button
							onClick={handleRemoveSynced}
							className="flex items-center space-x-2 px-3 py-2 text-sm bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
						>
							<Cloud className="h-4 w-4" />
							<span>Limpiar Sincronizados</span>
						</button>

						<button
							onClick={() => setShowSettings(!showSettings)}
							className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
						>
							<Settings className="h-4 w-4" />
							<span>Configuración</span>
						</button>
					</div>

					{/* Settings Panel */}
					{showSettings && (
						<div className="mt-4 p-4 bg-white dark:bg-gray-700 rounded-lg border">
							<h4 className="text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
								Configuración Avanzada
							</h4>
							
							<div className="space-y-3">
								<div className="flex items-center justify-between">
									<span className="text-sm text-gray-600 dark:text-gray-400">
										Modo offline automático:
									</span>
									<label className="relative inline-flex items-center cursor-pointer">
										<input type="checkbox" className="sr-only peer" defaultChecked />
										<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
									</label>
								</div>

								<div className="flex items-center justify-between">
									<span className="text-sm text-gray-600 dark:text-gray-400">
										Sincronización automática:
									</span>
									<label className="relative inline-flex items-center cursor-pointer">
										<input type="checkbox" className="sr-only peer" defaultChecked />
										<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
									</label>
								</div>

								<div className="flex items-center justify-between">
									<span className="text-sm text-gray-600 dark:text-gray-400">
										Notificaciones push:
									</span>
									<label className="relative inline-flex items-center cursor-pointer">
										<input type="checkbox" className="sr-only peer" defaultChecked />
										<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
									</label>
								</div>

								<div className="pt-3 border-t border-gray-200 dark:border-gray-600">
									<button
										onClick={handleClearAll}
										className="flex items-center space-x-2 px-3 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors w-full justify-center"
									>
										<Trash2 className="h-4 w-4" />
										<span>Eliminar Todos los Datos Offline</span>
									</button>
								</div>
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	)
}

export default OfflineStatus
