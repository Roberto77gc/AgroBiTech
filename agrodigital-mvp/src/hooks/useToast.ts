import { useState, useCallback } from 'react'

export type ToastType = 'info' | 'warning' | 'error' | 'success'

export interface Toast {
	id: string
	type: ToastType
	message: string
	duration?: number
}

export function useToast() {
	const [toasts, setToasts] = useState<Toast[]>([])

	const showToast = useCallback((message: string, type: ToastType = 'info', duration: number = 5000) => {
		const id = Date.now().toString()
		const newToast: Toast = { id, type, message, duration }
		
		setToasts(prev => [...prev, newToast])
		
		// Auto-remove toast after duration
		setTimeout(() => {
			setToasts(prev => prev.filter(toast => toast.id !== id))
		}, duration)
		
		return id
	}, [])

	const removeToast = useCallback((id: string) => {
		setToasts(prev => prev.filter(toast => toast.id !== id))
	}, [])

	const clearAll = useCallback(() => {
		setToasts([])
	}, [])

	return {
		toasts,
		showToast,
		removeToast,
		clearAll
	}
}
