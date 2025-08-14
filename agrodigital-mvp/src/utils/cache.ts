interface CacheEntry<T> { data: T; savedAt: number }

export function readCache<T>(key: string): T | null {
	try {
		const raw = localStorage.getItem(key)
		if (!raw) return null
		const parsed = JSON.parse(raw) as CacheEntry<T> | T
		// soporta formato simple o con envoltorio
		return (parsed as any)?.data != null ? (parsed as any).data as T : (parsed as any as T)
	} catch { return null }
}

export function writeCache<T>(key: string, data: T) {
	try { localStorage.setItem(key, JSON.stringify({ data, savedAt: Date.now() })) } catch {}
}

export async function getWithCache<T>(key: string, fetcher: () => Promise<T>, onUpdate?: (fresh: T) => void): Promise<T | null> {
	const cached = readCache<T>(key)
	// revalidar en segundo plano
	fetcher().then(fresh => { writeCache(key, fresh); if (onUpdate) onUpdate(fresh) }).catch(() => {})
	return cached
}


