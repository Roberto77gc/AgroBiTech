import { useEffect, useCallback, useRef } from 'react'
import { addNotification } from '../components/ui/NotificationSystem'

interface StockAlert {
	productId: string
	productName: string
	currentStock: number
	unit: string
	threshold: number
}

interface CostAlert {
	activityId: string
	activityName: string
	totalCost: number
	averageCost: number
	percentage: number
}

interface ScheduledActivity {
	id: string
	name: string
	scheduledDate: string
	daysUntil: number
}

export const useSmartNotifications = () => {
	const lastStockCheck = useRef<number>(0)
	const lastCostCheck = useRef<number>(0)
	const lastScheduleCheck = useRef<number>(0)

	// Check stock levels and alert if low
	const checkStockLevels = useCallback(async () => {
		try {
			// This would typically call your inventory API
			// For now, we'll simulate with mock data
			const mockStockAlerts: StockAlert[] = [
				{
					productId: '1',
					productName: 'Fertilizante NPK',
					currentStock: 50,
					unit: 'kg',
					threshold: 100
				},
				{
					productId: '2',
					productName: 'Fungicida',
					currentStock: 2,
					unit: 'L',
					threshold: 5
				}
			]

			mockStockAlerts.forEach(alert => {
				if (alert.currentStock <= alert.threshold) {
					addNotification({
						type: alert.currentStock === 0 ? 'error' : 'warning',
						title: 'Stock Bajo',
						message: `${alert.productName} tiene solo ${alert.currentStock} ${alert.unit} en inventario`,
						dismissible: true,
						action: {
							label: 'Ver Inventario',
							onClick: () => {
								// Navigate to inventory
								window.dispatchEvent(new CustomEvent('agrodigital:open-inventory'))
							}
						}
					})
				}
			})

			lastStockCheck.current = Date.now()
		} catch (error) {
			console.warn('Could not check stock levels:', error)
		}
	}, [])

	// Check cost anomalies and alert if costs are unusually high
	const checkCostAnomalies = useCallback(async () => {
		try {
			// This would typically analyze your cost data
			// For now, we'll simulate with mock data
			const mockCostAlerts: CostAlert[] = [
				{
					activityId: '1',
					activityName: 'Fertirrigación Tomates',
					totalCost: 150,
					averageCost: 80,
					percentage: 87.5
				}
			]

			mockCostAlerts.forEach(alert => {
				if (alert.percentage > 50) { // 50% above average
					addNotification({
						type: 'warning',
						title: 'Costo Elevado',
						message: `${alert.activityName} tiene un costo ${alert.percentage}% superior al promedio`,
						dismissible: true,
						action: {
							label: 'Ver Detalles',
							onClick: () => {
								// Navigate to activity details
								window.dispatchEvent(new CustomEvent('agrodigital:open-activity', { 
									detail: { activityId: alert.activityId } 
								}))
							}
						}
					})
				}
			})

			lastCostCheck.current = Date.now()
		} catch (error) {
			console.warn('Could not check cost anomalies:', error)
		}
	}, [])

	// Check scheduled activities and remind users
	const checkScheduledActivities = useCallback(async () => {
		try {
			// This would typically check your calendar/schedule
			// For now, we'll simulate with mock data
			const mockScheduledActivities: ScheduledActivity[] = [
				{
					id: '1',
					name: 'Aplicación Fitosanitario',
					scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
					daysUntil: 2
				},
				{
					id: '2',
					name: 'Riego Programado',
					scheduledDate: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours from now
					daysUntil: 0.25
				}
			]

			mockScheduledActivities.forEach(activity => {
				if (activity.daysUntil <= 1) { // Within 24 hours
					addNotification({
						type: 'info',
						title: 'Actividad Programada',
						message: `${activity.name} está programada para ${activity.daysUntil === 0.25 ? 'en 6 horas' : `en ${activity.daysUntil} días`}`,
						dismissible: true,
						action: {
							label: 'Ver Calendario',
							onClick: () => {
								// Navigate to calendar/schedule
								window.dispatchEvent(new CustomEvent('agrodigital:open-schedule'))
							}
						}
					})
				}
			})

			lastScheduleCheck.current = Date.now()
		} catch (error) {
			console.warn('Could not check scheduled activities:', error)
		}
	}, [])

	// Check weather conditions and suggest actions
	const checkWeatherConditions = useCallback(async () => {
		try {
			// This would typically call a weather API
			// For now, we'll simulate with mock data
			const mockWeather = {
				temperature: 35,
				humidity: 30,
				rainChance: 10,
				windSpeed: 25
			}

			// High temperature alert
			if (mockWeather.temperature > 30) {
				addNotification({
					type: 'warning',
					title: 'Temperatura Alta',
					message: `Temperatura de ${mockWeather.temperature}°C. Considera riego adicional y protección solar para cultivos sensibles.`,
					dismissible: true,
					action: {
						label: 'Ver Pronóstico',
						onClick: () => {
							// Open weather forecast
							window.dispatchEvent(new CustomEvent('agrodigital:open-weather'))
						}
					}
				})
			}

			// Low humidity alert
			if (mockWeather.humidity < 40) {
				addNotification({
					type: 'info',
					title: 'Humedad Baja',
					message: `Humedad del ${mockWeather.humidity}%. Considera riego por aspersión para aumentar humedad ambiental.`,
					dismissible: true
				})
			}

			// High wind alert
			if (mockWeather.windSpeed > 20) {
				addNotification({
					type: 'warning',
					title: 'Viento Fuerte',
					message: `Velocidad del viento de ${mockWeather.windSpeed} km/h. Evita aplicaciones de fitosanitarios y riego por aspersión.`,
					dismissible: true
				})
			}
		} catch (error) {
			console.warn('Could not check weather conditions:', error)
		}
	}, [])

	// Main notification check function
	const runNotificationChecks = useCallback(async () => {
		const now = Date.now()
		
		// Check stock every 30 minutes
		if (now - lastStockCheck.current > 30 * 60 * 1000) {
			await checkStockLevels()
		}

		// Check costs every hour
		if (now - lastCostCheck.current > 60 * 60 * 1000) {
			await checkCostAnomalies()
		}

		// Check schedule every 2 hours
		if (now - lastScheduleCheck.current > 2 * 60 * 60 * 1000) {
			await checkScheduledActivities()
		}

		// Check weather every 4 hours
		await checkWeatherConditions()
	}, [checkStockLevels, checkCostAnomalies, checkScheduledActivities, checkWeatherConditions])

	// Set up periodic checks
	useEffect(() => {
		// Initial check
		runNotificationChecks()

		// Set up interval for periodic checks (every 15 minutes)
		const interval = setInterval(runNotificationChecks, 15 * 60 * 1000)

		return () => clearInterval(interval)
	}, [runNotificationChecks])

	// Listen for manual notification triggers
	useEffect(() => {
		const handleManualStockCheck = () => checkStockLevels()
		const handleManualCostCheck = () => checkCostAnomalies()
		const handleManualScheduleCheck = () => checkScheduledActivities()

		window.addEventListener('agrodigital:check-stock', handleManualStockCheck)
		window.addEventListener('agrodigital:check-costs', handleManualCostCheck)
		window.addEventListener('agrodigital:check-schedule', handleManualScheduleCheck)

		return () => {
			window.removeEventListener('agrodigital:check-stock', handleManualStockCheck)
			window.removeEventListener('agrodigital:check-costs', handleManualCostCheck)
			window.removeEventListener('agrodigital:check-schedule', handleManualScheduleCheck)
		}
	}, [checkStockLevels, checkCostAnomalies, checkScheduledActivities])

	return {
		checkStockLevels,
		checkCostAnomalies,
		checkScheduledActivities,
		checkWeatherConditions,
		runNotificationChecks
	}
}
