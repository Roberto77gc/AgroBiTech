import { useState, useEffect, useCallback } from 'react'
import { useToast } from './useToast'

export interface Notification {
	id: string
	type: 'info' | 'warning' | 'error' | 'success'
	title: string
	message: string
	timestamp: Date
	read: boolean
	action?: {
		label: string
		onClick: () => void
	}
}

export interface NotificationRule {
	id: string
	name: string
	enabled: boolean
	condition: 'stock_low' | 'cost_high' | 'reminder' | 'custom'
	threshold?: number
	message: string
	checkInterval: number // minutes
	lastChecked: Date
}

const DEFAULT_RULES: NotificationRule[] = [
	{
		id: 'stock_low',
		name: 'Stock Bajo',
		enabled: true,
		condition: 'stock_low',
		threshold: 10,
		message: 'El producto {productName} tiene stock bajo ({currentStock} unidades)',
		checkInterval: 30,
		lastChecked: new Date()
	},
	{
		id: 'cost_high',
		name: 'Costos Altos',
		enabled: true,
		condition: 'cost_high',
		threshold: 100,
		message: 'El costo diario ({cost}€) supera el umbral de {threshold}€',
		checkInterval: 60,
		lastChecked: new Date()
	},
	{
		id: 'daily_reminder',
		name: 'Recordatorio Diario',
		enabled: true,
		condition: 'reminder',
		message: 'No olvides registrar las actividades del día',
		checkInterval: 1440, // 24 horas
		lastChecked: new Date()
	}
]

export function useNotifications() {
	const [notifications, setNotifications] = useState<Notification[]>([])
	const [rules, setRules] = useState<NotificationRule[]>(DEFAULT_RULES)
	const [isEnabled, setIsEnabled] = useState<boolean>(Notification.permission === 'granted')
	const { showToast } = useToast()

	// Cargar notificaciones guardadas
	useEffect(() => {
		try {
			const saved = localStorage.getItem('notifications')
			if (saved) {
				setNotifications(JSON.parse(saved))
			}
			
			const savedRules = localStorage.getItem('notification_rules')
			if (savedRules) {
				setRules(JSON.parse(savedRules))
			}
		} catch (error) {
			console.warn('Error loading notifications:', error)
		}
	}, [])

	// Guardar notificaciones
	useEffect(() => {
		try {
			localStorage.setItem('notifications', JSON.stringify(notifications))
		} catch (error) {
			console.warn('Error saving notifications:', error)
		}
	}, [notifications])

	// Guardar reglas
	useEffect(() => {
		try {
			localStorage.setItem('notification_rules', JSON.stringify(rules))
		} catch (error) {
			console.warn('Error saving notification rules:', error)
		}
	}, [rules])

	// Solicitar permisos
	const requestPermission = useCallback(async () => {
		if (Notification.permission === 'default') {
			const permission = await Notification.requestPermission()
			setIsEnabled(permission === 'granted')
			return permission === 'granted'
		}
		return Notification.permission === 'granted'
	}, [])

	// Crear notificación
	const createNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
		const newNotification: Notification = {
			...notification,
			id: Date.now().toString(),
			timestamp: new Date(),
			read: false
		}

		setNotifications(prev => [newNotification, ...prev])

		// Mostrar toast
		showToast(notification.message, notification.type)

		// Mostrar notificación del navegador si está habilitado
		if (isEnabled && Notification.permission === 'granted') {
			new Notification(notification.title, {
				body: notification.message,
				icon: '/favicon.ico',
				tag: newNotification.id // Usar el ID de la nueva notificación creada
			})
		}

		return newNotification
	}, [isEnabled, showToast])

	// Marcar como leída
	const markAsRead = useCallback((id: string) => {
		setNotifications(prev => 
			prev.map(n => n.id === id ? { ...n, read: true } : n)
		)
	}, [])

	// Marcar todas como leídas
	const markAllAsRead = useCallback(() => {
		setNotifications(prev => prev.map(n => ({ ...n, read: true })))
	}, [])

	// Eliminar notificación
	const removeNotification = useCallback((id: string) => {
		setNotifications(prev => prev.filter(n => n.id !== id))
	}, [])

	// Limpiar todas
	const clearAll = useCallback(() => {
		setNotifications([])
	}, [])

	// Actualizar regla
	const updateRule = useCallback((id: string, updates: Partial<NotificationRule>) => {
		setRules(prev => prev.map(rule => 
			rule.id === id ? { ...rule, ...updates } : rule
		))
	}, [])

	// Verificar reglas
	const checkRules = useCallback((data: {
		inventory?: any[]
		activities?: any[]
		products?: any[]
	}) => {
		const now = new Date()
		const newNotifications: Array<{
			type: 'info' | 'warning' | 'error' | 'success'
			title: string
			message: string
			action: { label: string; onClick: () => void }
		}> = []

		rules.forEach(rule => {
			if (!rule.enabled) return

			// Verificar si es momento de revisar
			const timeSinceLastCheck = now.getTime() - rule.lastChecked.getTime()
			const minutesSinceLastCheck = timeSinceLastCheck / (1000 * 60)
			
			if (minutesSinceLastCheck < rule.checkInterval) return

			// Actualizar última revisión
			updateRule(rule.id, { lastChecked: now })

			switch (rule.condition) {
				case 'stock_low':
					if (data.inventory) {
						data.inventory.forEach(item => {
							if (item.stock <= (rule.threshold || 10)) {
								newNotifications.push({
									type: 'warning',
									title: 'Stock Bajo',
									message: rule.message
										.replace('{productName}', item.productName || 'Producto')
										.replace('{currentStock}', item.stock.toString()),
									action: {
										label: 'Ver Inventario',
										onClick: () => {
											console.log('Abrir inventario')
										}
									}
								})
							}
						})
					}
					break

				case 'cost_high':
					if (data.activities) {
						const today = new Date().toISOString().split('T')[0]
						const todayActivities = data.activities.filter(a => a.date === today)
						const totalCost = todayActivities.reduce((sum, a) => 
							sum + (a.fertilizersCost || 0) + (a.waterCost || 0) + 
							(a.phytosanitaryCost || 0) + (a.otherExpensesCost || 0), 0
						)

						if (totalCost > (rule.threshold || 100)) {
							newNotifications.push({
								type: 'error',
								title: 'Costos Altos',
								message: rule.message
									.replace('{cost}', totalCost.toFixed(2))
									.replace('{threshold}', (rule.threshold || 100).toString()),
								action: {
									label: 'Ver Dashboard',
									onClick: () => {
										console.log('Ir al dashboard')
									}
								}
							})
						}
					}
					break

				case 'reminder':
					// Recordatorio diario - solo una vez al día
					const lastReminder = notifications.find(n => 
						n.title === 'Recordatorio Diario' && 
						n.timestamp.toDateString() === now.toDateString()
					)
					
					if (!lastReminder) {
						newNotifications.push({
							type: 'info',
							title: 'Recordatorio Diario',
							message: rule.message,
							action: {
								label: 'Registrar Actividad',
								onClick: () => {
									console.log('Abrir modal de actividad')
								}
							}
						})
					}
					break
			}
		})

		// Crear todas las notificaciones usando createNotification para manejar propiedades requeridas
		newNotifications.forEach(notification => {
			createNotification({
				type: notification.type,
				title: notification.title,
				message: notification.message,
				action: notification.action
			})
		})
	}, [rules, notifications, createNotification, updateRule])

	return {
		notifications,
		rules,
		isEnabled,
		requestPermission,
		createNotification,
		markAsRead,
		markAllAsRead,
		removeNotification,
		clearAll,
		updateRule,
		checkRules,
		unreadCount: notifications.filter(n => !n.read).length
	}
}
