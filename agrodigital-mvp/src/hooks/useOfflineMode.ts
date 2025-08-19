import { useState, useEffect, useCallback, useRef } from 'react'
import { API_BASE_URL } from '../services/api'
import { offlineStorage, type OfflineData } from '../services/offlineStorage'

interface OfflineModeState {
	isOnline: boolean
	isOfflineMode: boolean
	hasPendingSync: boolean
	syncProgress: number
	lastSyncAttempt: number
	storageStats: {
		totalItems: number
		syncedItems: number
		pendingItems: number
		storageSize: number
		lastSync: number
	}
}

interface SyncResult {
	success: number
	failed: number
	total: number
}

export const useOfflineMode = () => {
	const [state, setState] = useState<OfflineModeState>({
		isOnline: navigator.onLine,
		isOfflineMode: false,
		hasPendingSync: false,
		syncProgress: 0,
		lastSyncAttempt: 0,
		storageStats: {
			totalItems: 0,
			syncedItems: 0,
			pendingItems: 0,
			storageSize: 0,
			lastSync: 0
		}
	})

	const syncInProgress = useRef(false)
	const syncInterval = useRef<NodeJS.Timeout | null>(null)
	const reconnectTimeout = useRef<NodeJS.Timeout | null>(null)

	// Initialize offline storage
	useEffect(() => {
		const initStorage = async () => {
			try {
				await offlineStorage.initialize()
				await updateStorageStats()
				await checkPendingSync()
			} catch (error) {
				console.error('Failed to initialize offline storage:', error)
			}
		}

		initStorage()
	}, [])

	// Network status monitoring
	useEffect(() => {
		const handleOnline = () => {
			console.log('Network: Online')
			setState(prev => ({ ...prev, isOnline: true }))
			
			// Attempt to sync when coming back online
			if (state.hasPendingSync) {
				// Wait a bit for network to stabilize
				setTimeout(() => {
					attemptSync()
				}, 2000)
			}
		}

		const handleOffline = () => {
			console.log('Network: Offline')
			setState(prev => ({ ...prev, isOnline: false }))
			
			// Clear any ongoing sync attempts
			if (syncInterval.current) {
				clearInterval(syncInterval.current)
				syncInterval.current = null
			}
		}

		window.addEventListener('online', handleOnline)
		window.addEventListener('offline', handleOffline)

		return () => {
			window.removeEventListener('online', handleOnline)
			window.removeEventListener('offline', handleOffline)
		}
	}, [state.hasPendingSync])

	// Auto-sync when online and has pending data
	useEffect(() => {
		if (state.isOnline && state.hasPendingSync && !syncInProgress.current) {
			// Delay sync to avoid conflicts with other operations
			const timeout = setTimeout(() => {
				attemptSync()
			}, 5000)

			return () => clearTimeout(timeout)
		}
	}, [state.isOnline, state.hasPendingSync])

	// Periodic sync check (every 5 minutes when online)
	useEffect(() => {
		if (state.isOnline) {
			syncInterval.current = setInterval(async () => {
				await checkPendingSync()
				if (state.hasPendingSync && !syncInProgress.current) {
					attemptSync()
				}
			}, 5 * 60 * 1000) // 5 minutes
		}

		return () => {
			if (syncInterval.current) {
				clearInterval(syncInterval.current)
				syncInterval.current = null
			}
		}
	}, [state.isOnline, state.hasPendingSync])

	// Update storage statistics
	const updateStorageStats = useCallback(async () => {
		try {
			const stats = await offlineStorage.getStorageStats()
			setState(prev => ({
				...prev,
				storageStats: stats,
				hasPendingSync: stats.pendingItems > 0
			}))
		} catch (error) {
			console.error('Failed to update storage stats:', error)
		}
	}, [])

	// Check for pending sync data
	const checkPendingSync = useCallback(async () => {
		try {
			const pendingData = await offlineStorage.getPendingSyncData()
			setState(prev => ({
				...prev,
				hasPendingSync: pendingData.length > 0
			}))
		} catch (error) {
			console.error('Failed to check pending sync:', error)
		}
	}, [])

	// Attempt to sync with server
	const attemptSync = useCallback(async (): Promise<SyncResult | null> => {
		if (syncInProgress.current || !state.isOnline) {
			return null
		}

		syncInProgress.current = true
		setState(prev => ({ ...prev, syncProgress: 0 }))

		try {
			console.log('Starting sync with server...')
			
			// Simulate progress updates
			const progressInterval = setInterval(() => {
				setState(prev => ({
					...prev,
					syncProgress: Math.min(prev.syncProgress + 10, 90)
				}))
			}, 200)

			const result = await offlineStorage.syncWithServer()
			
			clearInterval(progressInterval)
			setState(prev => ({ 
				...prev, 
				syncProgress: 100,
				lastSyncAttempt: Date.now()
			}))

			// Update stats after sync
			await updateStorageStats()
			await checkPendingSync()

			console.log(`Sync completed: ${result.success} successful, ${result.failed} failed`)
			
			// Reset progress after a delay
			setTimeout(() => {
				setState(prev => ({ ...prev, syncProgress: 0 }))
			}, 2000)

			return {
				...result,
				total: result.success + result.failed
			}

		} catch (error) {
			console.error('Sync failed:', error)
			setState(prev => ({ 
				...prev, 
				syncProgress: 0,
				lastSyncAttempt: Date.now()
			}))
			return null
		} finally {
			syncInProgress.current = false
		}
	}, [state.isOnline, updateStorageStats, checkPendingSync])

	// Force manual sync
	const forceSync = useCallback(async (): Promise<SyncResult | null> => {
		if (syncInProgress.current) {
			console.log('Sync already in progress')
			return null
		}

		return await attemptSync()
	}, [attemptSync])

	// Store data for offline use
	const storeOfflineData = useCallback(async (
		type: OfflineData['type'],
		action: OfflineData['action'],
		data: any
	): Promise<string> => {
		try {
			const id = await offlineStorage.storeOfflineData(type, action, data)
			await updateStorageStats()
			await checkPendingSync()
			return id
		} catch (error) {
			console.error('Failed to store offline data:', error)
			throw error
		}
	}, [updateStorageStats, checkPendingSync])

	// Get offline data
	const getOfflineData = useCallback(async (type?: OfflineData['type']) => {
		try {
			return await offlineStorage.getOfflineData(type)
		} catch (error) {
			console.error('Failed to get offline data:', error)
			return []
		}
	}, [])

	// Cache management
	const setCache = useCallback(async (key: string, data: any, expiryMinutes: number = 60) => {
		try {
			await offlineStorage.setCache(key, data, expiryMinutes)
		} catch (error) {
			console.error('Failed to set cache:', error)
		}
	}, [])

	const getCache = useCallback(async (key: string) => {
		try {
			return await offlineStorage.getCache(key)
		} catch (error) {
			console.error('Failed to get cache:', error)
			return null
		}
	}, [])

	// User data persistence
	const setUserData = useCallback(async (key: string, data: any) => {
		try {
			await offlineStorage.setUserData(key, data)
		} catch (error) {
			console.error('Failed to set user data:', error)
		}
	}, [])

	const getUserData = useCallback(async (key: string) => {
		try {
			return await offlineStorage.getUserData(key)
		} catch (error) {
			console.error('Failed to get user data:', error)
			return null
		}
	}, [])

	// Clear expired cache
	const clearExpiredCache = useCallback(async () => {
		try {
			await offlineStorage.clearExpiredCache()
			await updateStorageStats()
		} catch (error) {
			console.error('Failed to clear expired cache:', error)
		}
	}, [updateStorageStats])

	// Remove synced data
	const removeSyncedData = useCallback(async () => {
		try {
			await offlineStorage.removeSyncedData()
			await updateStorageStats()
		} catch (error) {
			console.error('Failed to remove synced data:', error)
		}
	}, [updateStorageStats])

	// Clear all offline data
	const clearAllData = useCallback(async () => {
		try {
			await offlineStorage.clearAll()
			await updateStorageStats()
			await checkPendingSync()
		} catch (error) {
			console.error('Failed to clear all data:', error)
		}
	}, [updateStorageStats, checkPendingSync])

	// Check if specific data type has pending sync
	const hasPendingSyncForType = useCallback(async (type: OfflineData['type']): Promise<boolean> => {
		try {
			const pendingData = await offlineStorage.getPendingSyncData()
			return pendingData.some(item => item.type === type)
		} catch (error) {
			console.error('Failed to check pending sync for type:', error)
			return false
		}
	}, [])

	// Get sync status for specific data type
	const getSyncStatusForType = useCallback(async (type: OfflineData['type']) => {
		try {
			const [allData, pendingData] = await Promise.all([
				offlineStorage.getOfflineData(type),
				offlineStorage.getPendingSyncData()
			])

			const typeData = allData.filter(item => item.type === type)
			const typePending = pendingData.filter(item => item.type === type)

			return {
				total: typeData.length,
				synced: typeData.length - typePending.length,
				pending: typePending.length,
				lastSync: typeData.length > 0 ? Math.max(...typeData.map(item => item.timestamp)) : 0
			}
		} catch (error) {
			console.error('Failed to get sync status for type:', error)
			return { total: 0, synced: 0, pending: 0, lastSync: 0 }
		}
	}, [])

	// Network quality detection
	const checkNetworkQuality = useCallback(async (): Promise<'excellent' | 'good' | 'poor' | 'offline'> => {
		if (!navigator.onLine) {
			return 'offline'
		}

		try {
			const startTime = performance.now()
			await fetch(`${API_BASE_URL}/health`, { 
				method: 'HEAD',
				cache: 'no-cache'
			})
			const endTime = performance.now()

			const latency = endTime - startTime

			if (latency < 100) return 'excellent'
			if (latency < 300) return 'good'
			return 'poor'
		} catch (error) {
			return 'poor'
		}
	}, [])

	// Auto-retry failed syncs with exponential backoff
	const retryFailedSyncs = useCallback(async () => {
		if (syncInProgress.current) return

		try {
			const result = await attemptSync()
			if (result && result.failed > 0) {
				// Schedule retry with exponential backoff
				const retryDelay = Math.min(1000 * Math.pow(2, Math.min(result.failed, 5)), 30000)
				
				if (reconnectTimeout.current) {
					clearTimeout(reconnectTimeout.current)
				}

				reconnectTimeout.current = setTimeout(() => {
					retryFailedSyncs()
				}, retryDelay)
			}
		} catch (error) {
			console.error('Retry sync failed:', error)
		}
	}, [attemptSync])

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (syncInterval.current) {
				clearInterval(syncInterval.current)
			}
			if (reconnectTimeout.current) {
				clearTimeout(reconnectTimeout.current)
			}
		}
	}, [])

	return {
		// State
		...state,
		
		// Actions
		attemptSync,
		forceSync,
		storeOfflineData,
		getOfflineData,
		setCache,
		getCache,
		setUserData,
		getUserData,
		clearExpiredCache,
		removeSyncedData,
		clearAllData,
		hasPendingSyncForType,
		getSyncStatusForType,
		checkNetworkQuality,
		retryFailedSyncs,
		
		// Utilities
		isSyncInProgress: syncInProgress.current,
		canSync: state.isOnline && !syncInProgress.current,
		needsSync: state.hasPendingSync && state.isOnline
	}
}
