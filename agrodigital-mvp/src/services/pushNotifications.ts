interface PushNotificationData {
	title: string
	body: string
	icon?: string
	badge?: string
	tag?: string
	data?: any
	actions?: Array<{
		action: string
		title: string
		icon?: string
	}>
}

class PushNotificationService {
	private isSupported: boolean
	private permission: NotificationPermission
	private serviceWorkerRegistration: ServiceWorkerRegistration | null = null

	constructor() {
		this.isSupported = 'Notification' in window && 'serviceWorker' in navigator
		this.permission = this.isSupported ? Notification.permission : 'denied'
		this.initialize()
	}

	private async initialize() {
		if (!this.isSupported) {
			console.warn('Push notifications not supported')
			return
		}

		try {
			// Register service worker for push notifications
			this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js')
			console.log('Service Worker registered for push notifications')
		} catch (error) {
			console.error('Failed to register service worker:', error)
		}
	}

	async requestPermission(): Promise<boolean> {
		if (!this.isSupported) {
			return false
		}

		if (this.permission === 'granted') {
			return true
		}

		if (this.permission === 'denied') {
			// Permission was previously denied, we can't request it again
			return false
		}

		try {
			const result = await Notification.requestPermission()
			this.permission = result
			return result === 'granted'
		} catch (error) {
			console.error('Error requesting notification permission:', error)
			return false
		}
	}

	async subscribeToPush(): Promise<PushSubscription | null> {
		if (!this.isSupported || !this.serviceWorkerRegistration) {
			return null
		}

		try {
			const subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: this.urlBase64ToUint8Array(process.env.VITE_VAPID_PUBLIC_KEY || '')
			})

			console.log('Push subscription created:', subscription)
			return subscription
		} catch (error) {
			console.error('Failed to subscribe to push notifications:', error)
			return null
		}
	}

	async unsubscribeFromPush(): Promise<boolean> {
		if (!this.serviceWorkerRegistration) {
			return false
		}

		try {
			const subscription = await this.serviceWorkerRegistration.pushManager.getSubscription()
			if (subscription) {
				await subscription.unsubscribe()
				console.log('Push subscription removed')
				return true
			}
			return false
		} catch (error) {
			console.error('Failed to unsubscribe from push notifications:', error)
			return false
		}
	}

	async sendNotification(data: PushNotificationData): Promise<void> {
		if (!this.isSupported || this.permission !== 'granted') {
			return
		}

		try {
			const notification = new Notification(data.title, {
				body: data.body,
				icon: data.icon || '/favicon.ico',
				badge: data.badge || '/favicon.ico',
				tag: data.tag,
				data: data.data,
				actions: data.actions,
				requireInteraction: true, // Keep notification visible until user interacts
				silent: false
			})

			// Handle notification click
			notification.onclick = (event) => {
				event.preventDefault()
				window.focus()
				
				// Emit custom event for app to handle
				window.dispatchEvent(new CustomEvent('agrodigital:notification-clicked', {
					detail: { notification: data }
				}))
				
				notification.close()
			}

			// Handle notification action clicks
			if (data.actions) {
				notification.onactionclick = (event) => {
					event.preventDefault()
					
					window.dispatchEvent(new CustomEvent('agrodigital:notification-action', {
						detail: { 
							action: event.action,
							notification: data 
						}
					}))
					
					notification.close()
				}
			}

			// Auto-close after 10 seconds
			setTimeout(() => {
				notification.close()
			}, 10000)

		} catch (error) {
			console.error('Failed to send notification:', error)
		}
	}

	// Send notification for stock alerts
	async sendStockAlert(productName: string, currentStock: number, threshold: number): Promise<void> {
		await this.sendNotification({
			title: '⚠️ Stock Bajo',
			body: `${productName} tiene solo ${currentStock} unidades. Umbral: ${threshold}`,
			tag: 'stock-alert',
			icon: '/icons/stock-warning.png',
			actions: [
				{
					action: 'view-inventory',
					title: 'Ver Inventario'
				},
				{
					action: 'order-now',
					title: 'Pedir Ahora'
				}
			],
			data: {
				type: 'stock-alert',
				productName,
				currentStock,
				threshold
			}
		})
	}

	// Send notification for cost alerts
	async sendCostAlert(activityName: string, cost: number, averageCost: number): Promise<void> {
		const percentage = ((cost - averageCost) / averageCost * 100).toFixed(1)
		await this.sendNotification({
			title: '💰 Costo Elevado',
			body: `${activityName} tiene un costo ${percentage}% superior al promedio`,
			tag: 'cost-alert',
			icon: '/icons/cost-warning.png',
			actions: [
				{
					action: 'view-activity',
					title: 'Ver Actividad'
				},
				{
					action: 'analyze-costs',
					title: 'Analizar Costos'
				}
			],
			data: {
				type: 'cost-alert',
				activityName,
				cost,
				averageCost
			}
		})
	}

	// Send notification for scheduled activities
	async sendScheduleReminder(activityName: string, scheduledDate: string, hoursUntil: number): Promise<void> {
		const timeText = hoursUntil < 1 ? 'en menos de 1 hora' : `en ${hoursUntil} horas`
		await this.sendNotification({
			title: '📅 Actividad Programada',
			body: `${activityName} está programada para ${timeText}`,
			tag: 'schedule-reminder',
			icon: '/icons/calendar.png',
			actions: [
				{
					action: 'view-schedule',
					title: 'Ver Calendario'
				},
				{
					action: 'mark-complete',
					title: 'Marcar Completada'
				}
			],
			data: {
				type: 'schedule-reminder',
				activityName,
				scheduledDate,
				hoursUntil
			}
		})
	}

	// Send notification for weather alerts
	async sendWeatherAlert(condition: string, message: string, severity: 'info' | 'warning' | 'error'): Promise<void> {
		const icons = {
			info: '🌤️',
			warning: '⚠️',
			error: '🚨'
		}
		
		await this.sendNotification({
			title: `${icons[severity]} Alerta Meteorológica`,
			body: message,
			tag: 'weather-alert',
			icon: `/icons/weather-${severity}.png`,
			actions: [
				{
					action: 'view-forecast',
					title: 'Ver Pronóstico'
				},
				{
					action: 'adjust-schedule',
					title: 'Ajustar Programación'
				}
			],
			data: {
				type: 'weather-alert',
				condition,
				severity
			}
		})
	}

	// Utility function to convert VAPID key
	private urlBase64ToUint8Array(base64String: string): Uint8Array {
		const padding = '='.repeat((4 - base64String.length % 4) % 4)
		const base64 = (base64String + padding)
			.replace(/-/g, '+')
			.replace(/_/g, '/')

		const rawData = window.atob(base64)
		const outputArray = new Uint8Array(rawData.length)

		for (let i = 0; i < rawData.length; ++i) {
			outputArray[i] = rawData.charCodeAt(i)
		}
		return outputArray
	}

	// Get current subscription
	async getCurrentSubscription(): Promise<PushSubscription | null> {
		if (!this.serviceWorkerRegistration) {
			return null
		}

		try {
			return await this.serviceWorkerRegistration.pushManager.getSubscription()
		} catch (error) {
			console.error('Failed to get current subscription:', error)
			return null
		}
	}

	// Check if notifications are supported and enabled
	isEnabled(): boolean {
		return this.isSupported && this.permission === 'granted'
	}

	// Get permission status
	getPermissionStatus(): NotificationPermission {
		return this.permission
	}
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService()

// Export types
export type { PushNotificationData }
