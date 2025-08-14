import { useCallback, useState } from 'react'
import { loadLastDay, saveLastDay } from '../utils/lastDay'

type LastDayType = 'fertigation' | 'phytosanitary' | 'water'

export function useLastDay<TPayload extends object = any>(activityName: string, type: LastDayType) {
	const [isLoading, setIsLoading] = useState(false)

	const load = useCallback(async (): Promise<TPayload | null> => {
		setIsLoading(true)
		try {
			const payload = await loadLastDay(activityName, type)
			return (payload as unknown) as TPayload || null
		} finally {
			setIsLoading(false)
		}
	}, [activityName, type])

	const save = useCallback(async (payload: TPayload) => {
		await saveLastDay(activityName, type, (payload as unknown) as any)
	}, [activityName, type])

	return { isLoading, load, save }
}


