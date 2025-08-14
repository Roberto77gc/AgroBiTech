import { useMemo } from 'react'

export function useRecentProducts(storageKey: string, max: number = 5) {
	const recentProductIds = useMemo(() => {
		try { return JSON.parse(localStorage.getItem(storageKey) || '[]') as string[] } catch { return [] }
	}, [storageKey])

	const pushRecent = (productId: string) => {
		try {
			const prev = JSON.parse(localStorage.getItem(storageKey) || '[]') as string[]
			const next = [productId, ...prev.filter(id => id !== productId)].slice(0, max)
			localStorage.setItem(storageKey, JSON.stringify(next))
		} catch {}
	}

	return { recentProductIds, pushRecent }
}


