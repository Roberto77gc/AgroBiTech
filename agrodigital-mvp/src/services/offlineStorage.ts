interface OfflineData {
	id: string
	type: 'activity' | 'inventory' | 'product' | 'supplier' | 'purchase'
	data: any
	timestamp: number
	synced: boolean
	action: 'create' | 'update' | 'delete'
}

interface StorageStats {
	totalItems: number
	syncedItems: number
	pendingItems: number
	storageSize: number
	lastSync: number
}

class OfflineStorageService {
	private dbName = 'AgroDigitalOffline'
	private dbVersion = 1
	private db: IDBDatabase | null = null
	private syncQueue: OfflineData[] = []
	private isInitialized = false

	async initialize(): Promise<void> {
		if (this.isInitialized) return

		return new Promise((resolve, reject) => {
			const request = indexedDB.open(this.dbName, this.dbVersion)

			request.onerror = () => {
				console.error('Failed to open IndexedDB:', request.error)
				reject(request.error)
			}

			request.onsuccess = () => {
				this.db = request.result
				this.isInitialized = true
				console.log('IndexedDB initialized successfully')
				resolve()
			}

			request.onupgradeneeded = (event) => {
				const db = (event.target as IDBOpenDBRequest).result

				// Create object stores
				if (!db.objectStoreNames.contains('offlineData')) {
					const offlineStore = db.createObjectStore('offlineData', { keyPath: 'id' })
					offlineStore.createIndex('type', 'type', { unique: false })
					offlineStore.createIndex('synced', 'synced', { unique: false })
					offlineStore.createIndex('timestamp', 'timestamp', { unique: false })
				}

				if (!db.objectStoreNames.contains('cache')) {
					const cacheStore = db.createObjectStore('cache', { keyPath: 'key' })
					cacheStore.createIndex('expiry', 'expiry', { unique: false })
				}

				if (!db.objectStoreNames.contains('userData')) {
					const userStore = db.createObjectStore('userData', { keyPath: 'key' })
				}

				console.log('IndexedDB schema upgraded')
			}
		})
	}

	// Store data for offline use
	async storeOfflineData(type: OfflineData['type'], action: OfflineData['action'], data: any): Promise<string> {
		await this.ensureInitialized()

		const offlineData: OfflineData = {
			id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			type,
			data,
			timestamp: Date.now(),
			synced: false,
			action
		}

		return new Promise((resolve, reject) => {
			const transaction = this.db!.transaction(['offlineData'], 'readwrite')
			const store = transaction.objectStore('offlineData')

			const request = store.add(offlineData)

			request.onsuccess = () => {
				this.syncQueue.push(offlineData)
				console.log(`Offline data stored: ${type} - ${action}`)
				resolve(offlineData.id)
			}

			request.onerror = () => {
				console.error('Failed to store offline data:', request.error)
				reject(request.error)
			}
		})
	}

	// Retrieve offline data
	async getOfflineData(type?: OfflineData['type']): Promise<OfflineData[]> {
		await this.ensureInitialized()

		return new Promise((resolve, reject) => {
			const transaction = this.db!.transaction(['offlineData'], 'readonly')
			const store = transaction.objectStore('offlineData')

			let request: IDBRequest

			if (type) {
				const index = store.index('type')
				request = index.getAll(type)
			} else {
				request = store.getAll()
			}

			request.onsuccess = () => {
				resolve(request.result || [])
			}

			request.onerror = () => {
				console.error('Failed to retrieve offline data:', request.error)
				reject(request.error)
			}
		})
	}

	// Get pending sync data
	async getPendingSyncData(): Promise<OfflineData[]> {
		await this.ensureInitialized()

		return new Promise((resolve, reject) => {
			const transaction = this.db!.transaction(['offlineData'], 'readonly')
			const store = transaction.objectStore('offlineData')
			const index = store.index('synced')
			const request = index.getAll(false)

			request.onsuccess = () => {
				resolve(request.result || [])
			}

			request.onerror = () => {
				console.error('Failed to get pending sync data:', request.error)
				reject(request.error)
			}
		})
	}

	// Mark data as synced
	async markAsSynced(id: string): Promise<void> {
		await this.ensureInitialized()

		return new Promise((resolve, reject) => {
			const transaction = this.db!.transaction(['offlineData'], 'readwrite')
			const store = transaction.objectStore('offlineData')

			// First get the data
			const getRequest = store.get(id)

			getRequest.onsuccess = () => {
				if (getRequest.result) {
					const data = getRequest.result
					data.synced = true
					data.timestamp = Date.now()

					const updateRequest = store.put(data)

					updateRequest.onsuccess = () => {
						// Remove from sync queue
						this.syncQueue = this.syncQueue.filter(item => item.id !== id)
						console.log(`Data marked as synced: ${id}`)
						resolve()
					}

					updateRequest.onerror = () => {
						console.error('Failed to update sync status:', updateRequest.error)
						reject(updateRequest.error)
					}
				} else {
					reject(new Error('Data not found'))
				}
			}

			getRequest.onerror = () => {
				console.error('Failed to get data for sync update:', getRequest.error)
				reject(getRequest.error)
			}
		})
	}

	// Remove synced data
	async removeSyncedData(): Promise<void> {
		await this.ensureInitialized()

		return new Promise((resolve, reject) => {
			const transaction = this.db!.transaction(['offlineData'], 'readwrite')
			const store = transaction.objectStore('offlineData')
			const index = store.index('synced')
			const request = index.getAllKeys(true) // Get all synced items

			request.onsuccess = () => {
				const keys = request.result || []
				if (keys.length === 0) {
					resolve()
					return
				}

				let deletedCount = 0
				const totalCount = keys.length

				keys.forEach(key => {
					const deleteRequest = store.delete(key)
					deleteRequest.onsuccess = () => {
						deletedCount++
						if (deletedCount === totalCount) {
							console.log(`Removed ${deletedCount} synced items`)
							resolve()
						}
					}
					deleteRequest.onerror = () => {
						console.error('Failed to delete synced item:', deleteRequest.error)
					}
				})
			}

			request.onerror = () => {
				console.error('Failed to get synced keys:', request.error)
				reject(request.error)
			}
		})
	}

	// Cache management
	async setCache(key: string, data: any, expiryMinutes: number = 60): Promise<void> {
		await this.ensureInitialized()

		const cacheItem = {
			key,
			data,
			expiry: Date.now() + (expiryMinutes * 60 * 1000)
		}

		return new Promise((resolve, reject) => {
			const transaction = this.db!.transaction(['cache'], 'readwrite')
			const store = transaction.objectStore('cache')
			const request = store.put(cacheItem)

			request.onsuccess = () => {
				console.log(`Cache set: ${key}`)
				resolve()
			}

			request.onerror = () => {
				console.error('Failed to set cache:', request.error)
				reject(request.error)
			}
		})
	}

	async getCache(key: string): Promise<any | null> {
		await this.ensureInitialized()

		return new Promise((resolve, reject) => {
			const transaction = this.db!.transaction(['cache'], 'readonly')
			const store = transaction.objectStore('cache')
			const request = store.get(key)

			request.onsuccess = () => {
				const result = request.result
				if (result && result.expiry > Date.now()) {
					console.log(`Cache hit: ${key}`)
					resolve(result.data)
				} else {
					console.log(`Cache miss or expired: ${key}`)
					resolve(null)
				}
			}

			request.onerror = () => {
				console.error('Failed to get cache:', request.error)
				reject(request.error)
			}
		})
	}

	async clearExpiredCache(): Promise<void> {
		await this.ensureInitialized()

		return new Promise((resolve, reject) => {
			const transaction = this.db!.transaction(['cache'], 'readwrite')
			const store = transaction.objectStore('cache')
			const index = store.index('expiry')
			const request = index.getAllKeys(IDBKeyRange.upperBound(Date.now()))

			request.onsuccess = () => {
				const keys = request.result || []
				if (keys.length === 0) {
					resolve()
					return
				}

				let deletedCount = 0
				const totalCount = keys.length

				keys.forEach(key => {
					const deleteRequest = store.delete(key)
					deleteRequest.onsuccess = () => {
						deletedCount++
						if (deletedCount === totalCount) {
							console.log(`Cleared ${deletedCount} expired cache items`)
							resolve()
						}
					}
					deleteRequest.onerror = () => {
						console.error('Failed to delete expired cache item:', deleteRequest.error)
					}
				})
			}

			request.onerror = () => {
				console.error('Failed to get expired cache keys:', request.error)
				reject(request.error)
			}
		})
	}

	// User data persistence
	async setUserData(key: string, data: any): Promise<void> {
		await this.ensureInitialized()

		const userData = {
			key,
			data,
			timestamp: Date.now()
		}

		return new Promise((resolve, reject) => {
			const transaction = this.db!.transaction(['userData'], 'readwrite')
			const store = transaction.objectStore('userData')
			const request = store.put(userData)

			request.onsuccess = () => {
				console.log(`User data set: ${key}`)
				resolve()
			}

			request.onerror = () => {
				console.error('Failed to set user data:', request.error)
				reject(request.error)
			}
		})
	}

	async getUserData(key: string): Promise<any | null> {
		await this.ensureInitialized()

		return new Promise((resolve, reject) => {
			const transaction = this.db!.transaction(['userData'], 'readonly')
			const store = transaction.objectStore('userData')
			const request = store.get(key)

			request.onsuccess = () => {
				const result = request.result
				resolve(result ? result.data : null)
			}

			request.onerror = () => {
				console.error('Failed to get user data:', request.error)
				reject(request.error)
			}
		})
	}

	// Storage statistics
	async getStorageStats(): Promise<StorageStats> {
		await this.ensureInitialized()

		const [totalItems, syncedItems, pendingItems] = await Promise.all([
			this.getOfflineData(),
			this.getOfflineData().then(data => data.filter(item => item.synced)),
			this.getPendingSyncData()
		])

		return {
			totalItems: totalItems.length,
			syncedItems: syncedItems.length,
			pendingItems: pendingItems.length,
			storageSize: await this.getStorageSize(),
			lastSync: this.getLastSyncTime()
		}
	}

	private async getStorageSize(): Promise<number> {
		if ('storage' in navigator && 'estimate' in navigator.storage) {
			try {
				const estimate = await navigator.storage.estimate()
				return estimate.usage || 0
			} catch (error) {
				console.warn('Could not get storage estimate:', error)
			}
		}
		return 0
	}

	private getLastSyncTime(): number {
		const lastSync = localStorage.getItem('agrodigital:last-sync')
		return lastSync ? parseInt(lastSync) : 0
	}

	// Sync operations
	async syncWithServer(): Promise<{ success: number; failed: number }> {
		const pendingData = await this.getPendingSyncData()
		if (pendingData.length === 0) {
			return { success: 0, failed: 0 }
		}

		let successCount = 0
		let failedCount = 0

		for (const item of pendingData) {
			try {
				await this.syncItem(item)
				await this.markAsSynced(item.id)
				successCount++
			} catch (error) {
				console.error(`Failed to sync item ${item.id}:`, error)
				failedCount++
			}
		}

		// Update last sync time
		localStorage.setItem('agrodigital:last-sync', Date.now().toString())

		return { success: successCount, failed: failedCount }
	}

	private async syncItem(item: OfflineData): Promise<void> {
		// This would typically make an API call to sync with the server
		// For now, we'll simulate the sync process
		const endpoint = this.getEndpointForType(item.type)
		
		if (!endpoint) {
			throw new Error(`Unknown type: ${item.type}`)
		}

		// Simulate API call
		await new Promise(resolve => setTimeout(resolve, 100))

		// Simulate random failures for testing
		if (Math.random() < 0.1) {
			throw new Error('Simulated sync failure')
		}

		console.log(`Synced item: ${item.type} - ${item.action}`)
	}

	private getEndpointForType(type: OfflineData['type']): string | null {
		const endpoints = {
			activity: '/api/activities',
			inventory: '/api/inventory',
			product: '/api/products',
			supplier: '/api/suppliers',
			purchase: '/api/purchases'
		}
		return endpoints[type] || null
	}

	// Utility methods
	private async ensureInitialized(): Promise<void> {
		if (!this.isInitialized) {
			await this.initialize()
		}
	}

	// Cleanup
	async clearAll(): Promise<void> {
		await this.ensureInitialized()

		const stores = ['offlineData', 'cache', 'userData']
		const promises = stores.map(storeName => {
			return new Promise<void>((resolve, reject) => {
				const transaction = this.db!.transaction([storeName], 'readwrite')
				const store = transaction.objectStore(storeName)
				const request = store.clear()

				request.onsuccess = () => resolve()
				request.onerror = () => reject(request.error)
			})
		})

		await Promise.all(promises)
		this.syncQueue = []
		console.log('All offline data cleared')
	}

	// Close database
	close(): void {
		if (this.db) {
			this.db.close()
			this.db = null
			this.isInitialized = false
			console.log('IndexedDB closed')
		}
	}
}

// Export singleton instance
export const offlineStorage = new OfflineStorageService()

// Export types
export type { OfflineData, StorageStats }
