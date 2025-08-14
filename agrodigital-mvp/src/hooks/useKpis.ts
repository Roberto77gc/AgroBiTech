import { useState } from 'react'

export function useKpis(activityName: string) {
	const [kpiAreaHa, setKpiAreaHa] = useState<number>(() => { try { return Number(localStorage.getItem(`fertigation:kpi:area:${activityName}`) || 0) } catch { return 0 } })
	const [kpiPlants, setKpiPlants] = useState<number>(() => { try { return Number(localStorage.getItem(`fertigation:kpi:plants:${activityName}`) || 0) } catch { return 0 } })

	const persistArea = (v: number) => { setKpiAreaHa(v); try { localStorage.setItem(`fertigation:kpi:area:${activityName}`, String(v)) } catch {} }
	const persistPlants = (v: number) => { setKpiPlants(v); try { localStorage.setItem(`fertigation:kpi:plants:${activityName}`, String(v)) } catch {} }

	return { kpiAreaHa, kpiPlants, setKpiAreaHa: persistArea, setKpiPlants: persistPlants }
}


