import { useEffect, useRef, useState } from 'react'

export interface AutosaveOptions<T> {
	// Si el modal está abierto
	isOpen: boolean
	// Ref externa que controla cuándo comenzar a guardar (evita primer render)
	isReadyRef?: React.MutableRefObject<boolean>
	// Clave de almacenamiento
	storageKey: string
	// Objeto a persistir
	payload: T
	// Retraso de debounce en ms
	delay?: number
}

export function useAutosaveDraft<T>({ isOpen, isReadyRef, storageKey, payload, delay = 500 }: AutosaveOptions<T>) {
	const [savedAt, setSavedAt] = useState<number | null>(null)
	const [hasDraft, setHasDraft] = useState<boolean>(false)
	const timeoutRef = useRef<number | undefined>(undefined)

	// Estado inicial: detectar si ya existe borrador y leer savedAt
	useEffect(() => {
		try {
			const raw = localStorage.getItem(storageKey)
			if (raw) {
				setHasDraft(true)
				try {
					const parsed = JSON.parse(raw)
					if (typeof parsed?.savedAt === 'number') setSavedAt(parsed.savedAt)
				} catch {}
			} else {
				setHasDraft(false)
				setSavedAt(null)
			}
		} catch {}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [storageKey, isOpen])

	// Guardado con debounce cuando cambie el payload
	useEffect(() => {
		if (!isOpen) return
		if (isReadyRef && !isReadyRef.current) return

		// @ts-ignore
		timeoutRef.current = window.setTimeout(() => {
			try {
				const now = Date.now()
				const data = JSON.stringify({ ...(payload as unknown as object), savedAt: now })
				localStorage.setItem(storageKey, data)
				setHasDraft(true)
				setSavedAt(now)
			} catch {}
		}, delay)

		return () => { if (timeoutRef.current) window.clearTimeout(timeoutRef.current) }
	}, [payload, isOpen, isReadyRef, storageKey, delay])

	const clearDraft = () => {
		try { localStorage.removeItem(storageKey) } catch {}
		setHasDraft(false)
		setSavedAt(null)
	}

	return { savedAt, hasDraft, clearDraft }
}


