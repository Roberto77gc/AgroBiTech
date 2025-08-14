import { templateAPI } from '../services/api'

type LastDayType = 'fertigation' | 'phytosanitary' | 'water'

export const loadLastDay = async (activityName: string, type: LastDayType): Promise<any | null> => {
	try {
		const name = `LAST__${activityName}`
		const res = await templateAPI.list(`${type}:last`)
		const arr = Array.isArray(res?.templates) ? res.templates : []
		const found = arr.find((t: any) => t?.name === name)
		if (found?.payload) return found.payload
	} catch {}
	try {
		const raw = localStorage.getItem(`${type}:last:${activityName}`)
		if (!raw) return null
		return JSON.parse(raw)
	} catch {
		return null
	}
}

export const saveLastDay = async (activityName: string, type: LastDayType, payload: any): Promise<void> => {
	// Local
	try { localStorage.setItem(`${type}:last:${activityName}`, JSON.stringify(payload)) } catch {}
	// Backend (upsert)
	try {
		const name = `LAST__${activityName}`
		const list = await templateAPI.list(`${type}:last`)
		const arr = Array.isArray(list?.templates) ? list.templates : []
		const existing = arr.find((t: any) => t?.name === name)
		if (existing) await templateAPI.update(existing._id, { name, payload })
		else await templateAPI.create({ name, type: `${type}:last`, payload })
	} catch {}
}


