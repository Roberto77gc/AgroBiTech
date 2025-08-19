// Enhanced cache system with TTL, background revalidation, and state management
interface CacheEntry<T> {
	data: T
	timestamp: number
	ttl: number
	lastValidated: number
	validating: boolean
}

interface CacheConfig {
	defaultTTL: number
	staleWhileRevalidate: number
	backgroundRevalidate: boolean
}

class SmartCache {
	private cache = new Map<string, CacheEntry<any>>()
	private config: CacheConfig
	private revalidationQueue = new Set<string>()

	constructor(config: Partial<CacheConfig> = {}) {
		this.config = {
			defaultTTL: 5 * 60 * 1000, // 5 minutes
			staleWhileRevalidate: 10 * 60 * 1000, // 10 minutes
			backgroundRevalidate: true,
			...config
		}
	}

	// Get data with smart revalidation
	async get<T>(
		key: string,
		fetcher: () => Promise<T>,
		options?: { ttl?: number; force?: boolean }
	): Promise<T> {
		const entry = this.cache.get(key)
		const now = Date.now()
		const ttl = options?.ttl || this.config.defaultTTL

		// Force refresh or no cache
		if (options?.force || !entry) {
			return this.fetchAndCache(key, fetcher, ttl)
		}

		const isStale = now - entry.timestamp > ttl
		const isExpired = now - entry.timestamp > ttl + this.config.staleWhileRevalidate

		// Return cached data if fresh
		if (!isStale) {
			return entry.data
		}

		// Return stale data if available and trigger background revalidation
		if (!isExpired && this.config.backgroundRevalidate) {
			this.triggerBackgroundRevalidation(key, fetcher, ttl)
			return entry.data
		}

		// Fetch fresh data
		return this.fetchAndCache(key, fetcher, ttl)
	}

	private async fetchAndCache<T>(key: string, fetcher: () => Promise<T>, ttl: number): Promise<T> {
		const now = Date.now()
		const data = await fetcher()
		
		this.cache.set(key, {
			data,
			timestamp: now,
			ttl,
			lastValidated: now,
			validating: false
		})

		return data
	}

	private async triggerBackgroundRevalidation<T>(
		key: string,
		fetcher: () => Promise<T>,
		ttl: number
	): Promise<void> {
		if (this.revalidationQueue.has(key)) return

		this.revalidationQueue.add(key)
		const entry = this.cache.get(key)
		if (entry) entry.validating = true

		try {
			const data = await fetcher()
			const now = Date.now()
			
			this.cache.set(key, {
				data,
				timestamp: now,
				ttl,
				lastValidated: now,
				validating: false
			})
		} catch (error) {
			console.warn(`Background revalidation failed for ${key}:`, error)
		} finally {
			this.revalidationQueue.delete(key)
			const entry = this.cache.get(key)
			if (entry) entry.validating = false
		}
	}

	// Get cache state for UI indicators
	getState(key: string): 'fresh' | 'stale' | 'expired' | 'validating' | 'none' {
		const entry = this.cache.get(key)
		if (!entry) return 'none'

		const now = Date.now()
		const isStale = now - entry.timestamp > entry.ttl
		const isExpired = now - entry.timestamp > entry.ttl + this.config.staleWhileRevalidate

		if (entry.validating) return 'validating'
		if (isExpired) return 'expired'
		if (isStale) return 'stale'
		return 'fresh'
	}

	// Get last validation time
	getLastValidated(key: string): number | null {
		const entry = this.cache.get(key)
		return entry?.lastValidated || null
	}

	// Invalidate specific key or all
	invalidate(key?: string): void {
		if (key) {
			this.cache.delete(key)
		} else {
			this.cache.clear()
		}
	}

	// Get cache size and stats
	getStats() {
		const now = Date.now()
		let fresh = 0, stale = 0, expired = 0, validating = 0

		for (const entry of this.cache.values()) {
			const isStale = now - entry.timestamp > entry.ttl
			const isExpired = now - entry.timestamp > entry.ttl + this.config.staleWhileRevalidate

			if (entry.validating) validating++
			else if (isExpired) expired++
			else if (isStale) stale++
			else fresh++
		}

		return {
			total: this.cache.size,
			fresh,
			stale,
			expired,
			validating
		}
	}
}

// Specialized caches for different data types
export const inventoryCache = new SmartCache({
	defaultTTL: 2 * 60 * 1000, // 2 minutes for inventory
	staleWhileRevalidate: 5 * 60 * 1000,
	backgroundRevalidate: true
})

export const productCache = new SmartCache({
	defaultTTL: 10 * 60 * 1000, // 10 minutes for products
	staleWhileRevalidate: 30 * 60 * 1000,
	backgroundRevalidate: true
})

export const statsCache = new SmartCache({
	defaultTTL: 5 * 60 * 1000, // 5 minutes for stats
	staleWhileRevalidate: 15 * 60 * 1000,
	backgroundRevalidate: true
})

// Legacy functions for backward compatibility
export const getWithCache = async <T>(
	key: string,
	fetcher: () => Promise<T>,
	ttl?: number
): Promise<T> => {
	return statsCache.get(key, fetcher, { ttl })
}

export const readCache = <T>(key: string): T | null => {
	// Use the public API instead of accessing private properties
	try {
		return statsCache.get(key, async () => null as T) as T | null
	} catch {
		return null
	}
}

export const writeCache = <T>(key: string, data: T, ttl?: number): void => {
	// Use the public API instead of accessing private properties
	statsCache.get(key, async () => data, { ttl })
}


