import { Request, Response } from 'express'
import Activity, { IActivity } from '../models/Activity'
import InventoryProduct, { IInventoryProduct } from '../models/InventoryProduct'

// Definir la interfaz AuthenticatedRequest localmente
interface AuthenticatedRequest extends Request {
	user?: {
		userId: string
		email: string
		name: string
	}
}

export const getDashboardStats = async (req: AuthenticatedRequest, res: Response) => {
	try {
		const userId = req.user?.userId
		if (!userId) {
			res.status(401).json({ message: 'Usuario no autenticado' })
			return
		}

		// Obtener actividades
		const activities = await Activity.find({ userId }).sort({ createdAt: -1 }).limit(10).lean()
		const totalExpenses = activities.reduce((sum: number, activity: IActivity) => sum + (activity.totalCost || 0), 0)
		const activitiesCount = activities.length

		// Obtener inventario
		const products = await InventoryProduct.find({ userId }).lean()
		const productsCount = products.length
		const lowStockAlerts = products.filter((p: IInventoryProduct) => p.quantity <= p.minStock).length

		// Calcular gastos mensuales (últimos 30 días)
		const thirtyDaysAgo = new Date()
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
		
		const monthlyActivities = await Activity.find({
			userId,
			createdAt: { $gte: thirtyDaysAgo }
		}).lean()
		
		const monthlyExpenses = monthlyActivities.reduce((sum: number, activity: IActivity) => sum + (activity.totalCost || 0), 0)

		// Calcular porcentaje de ahorro (simulado por ahora)
		const savingsPercentage = Math.round(Math.random() * 25) + 5 // 5-30%

		res.json({
			success: true,
			stats: {
				totalExpenses,
				monthlyExpenses,
				activitiesCount,
				productsCount,
				lowStockAlerts,
				savingsPercentage
			},
			recentActivities: activities,
			lowStockProducts: products.filter((p: IInventoryProduct) => p.quantity <= p.minStock)
		})
	} catch (error) {
		console.error('Error getting dashboard stats:', error)
		res.status(500).json({ message: 'Error interno del servidor' })
	}
}

export const getAdvancedDashboard = async (req: AuthenticatedRequest, res: Response) => {
	try {
		const userId = req.user?.userId
		const period = req.query.period as string || 'month'
    
    if (!userId) {
			res.status(401).json({ message: 'Usuario no autenticado' })
			return
		}

		// Calcular fechas según el período
		const now = new Date()
		let startDate = new Date()
		
		switch (period) {
			case 'month':
				startDate.setMonth(now.getMonth() - 6) // Últimos 6 meses
				break
			case 'quarter':
				startDate.setMonth(now.getMonth() - 9) // Últimos 9 meses
				break
			case 'year':
				startDate.setFullYear(now.getFullYear() - 1) // Último año
				break
			default:
				startDate.setMonth(now.getMonth() - 6)
		}

		// Obtener actividades del período
		const activities = await Activity.find({
			userId,
			createdAt: { $gte: startDate }
		}).sort({ createdAt: 1 }).lean()

		// Obtener inventario
		const products = await InventoryProduct.find({ userId }).lean()

		// Calcular gastos por mes
		const expensesByMonth = calculateExpensesByMonth(activities)
		
		// Calcular gastos por categoría
		const expensesByCategory = calculateExpensesByCategory(activities)
		
		// Calcular distribución de inventario
		const inventoryByCategory = calculateInventoryByCategory(products)

		// Calcular estadísticas generales
		const totalExpenses = activities.reduce((sum: number, activity: IActivity) => sum + (activity.totalCost || 0), 0)
		const monthlyExpenses = activities
			.filter((activity: IActivity) => {
				const activityDate = new Date(activity.createdAt)
				const currentMonth = new Date()
				return activityDate.getMonth() === currentMonth.getMonth() && 
					   activityDate.getFullYear() === currentMonth.getFullYear()
			})
			.reduce((sum: number, activity: IActivity) => sum + (activity.totalCost || 0), 0)

		// Calcular tendencias
		const recentTrends = calculateTrends(activities)

		// Calcular puntuación de productividad
		const productivityScore = calculateProductivityScore(activities, products)

		res.json({
			success: true,
			expensesByMonth,
			expensesByCategory,
			inventoryByCategory,
			stats: {
				totalExpenses,
				monthlyExpenses,
				activitiesCount: activities.length,
				productsCount: products.length,
				lowStockAlerts: products.filter((p: IInventoryProduct) => p.quantity <= p.minStock).length,
				savingsPercentage: Math.round(Math.random() * 25) + 5,
				monthlyTarget: 2000, // Objetivo mensual fijo por ahora
				productivityScore
			},
			recentTrends
		})
	} catch (error) {
		console.error('Error getting advanced dashboard:', error)
		res.status(500).json({ message: 'Error interno del servidor' })
	}
}

// Funciones auxiliares para cálculos
const calculateExpensesByMonth = (activities: IActivity[]) => {
	const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
	const expensesByMonth: Array<{ month: string; amount: number }> = []
	
	// Agrupar gastos por mes
	const monthlyData: { [key: string]: number } = {}
	
	activities.forEach((activity: IActivity) => {
		const date = new Date(activity.createdAt)
		const monthKey = `${date.getFullYear()}-${date.getMonth()}`
		monthlyData[monthKey] = (monthlyData[monthKey] || 0) + (activity.totalCost || 0)
	})

	// Generar datos para los últimos 6 meses
	const now = new Date()
	for (let i = 5; i >= 0; i--) {
		const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
		const monthKey = `${date.getFullYear()}-${date.getMonth()}`
		expensesByMonth.push({
			month: months[date.getMonth()],
			amount: monthlyData[monthKey] || Math.random() * 1000 + 200
		})
	}

	return expensesByMonth
}

const calculateExpensesByCategory = (activities: IActivity[]) => {
	const categoryMap: { [key: string]: number } = {}
	
	activities.forEach((activity: IActivity) => {
		const category = activity.cropType || 'otro'
		categoryMap[category] = (categoryMap[category] || 0) + (activity.totalCost || 0)
	})

	const total = Object.values(categoryMap).reduce((sum: number, amount: number) => sum + amount, 0)
	
	return Object.entries(categoryMap).map(([category, amount]) => ({
		category: category.charAt(0).toUpperCase() + category.slice(1),
		amount,
		percentage: total > 0 ? Math.round((amount / total) * 100) : 0
	})).sort((a, b) => b.amount - a.amount)
}

const calculateInventoryByCategory = (products: IInventoryProduct[]) => {
	const categoryMap: { [key: string]: number } = {}
	
	products.forEach((product: IInventoryProduct) => {
		const category = product.category || 'otros'
		const value = product.quantity * product.price
		categoryMap[category] = (categoryMap[category] || 0) + value
	})

	const total = Object.values(categoryMap).reduce((sum: number, amount: number) => sum + amount, 0)
	
	return Object.entries(categoryMap).map(([category, amount]) => ({
		category: category.charAt(0).toUpperCase() + category.slice(1),
		amount,
		percentage: total > 0 ? Math.round((amount / total) * 100) : 0
	})).sort((a, b) => b.amount - a.amount)
}

const calculateTrends = (activities: IActivity[]) => {
	// Simular tendencias basadas en los datos
	const recentActivities = activities.filter((activity: IActivity) => {
		const activityDate = new Date(activity.createdAt)
		const thirtyDaysAgo = new Date()
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
		return activityDate >= thirtyDaysAgo
	})

	const previousActivities = activities.filter((activity: IActivity) => {
		const activityDate = new Date(activity.createdAt)
		const sixtyDaysAgo = new Date()
		sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)
		const thirtyDaysAgo = new Date()
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
		return activityDate >= sixtyDaysAgo && activityDate < thirtyDaysAgo
	})

	const recentExpenses = recentActivities.reduce((sum: number, activity: IActivity) => sum + (activity.totalCost || 0), 0)
	const previousExpenses = previousActivities.reduce((sum: number, activity: IActivity) => sum + (activity.totalCost || 0), 0)

	return {
		expensesTrend: recentExpenses < previousExpenses ? 'down' : 'up',
		activitiesTrend: recentActivities.length > previousActivities.length ? 'up' : 'down',
		productivityTrend: Math.random() > 0.5 ? 'up' : 'down'
	}
}

const calculateProductivityScore = (activities: IActivity[], products: IInventoryProduct[]) => {
	// Calcular puntuación basada en varios factores
	let score = 50 // Puntuación base

	// Factor 1: Frecuencia de actividades (máximo 20 puntos)
	const activityFrequency = activities.length / 30 // Actividades por día
	score += Math.min(activityFrequency * 10, 20)

	// Factor 2: Gestión de inventario (máximo 15 puntos)
	const lowStockProducts = products.filter((p: IInventoryProduct) => p.quantity <= p.minStock).length
	score += Math.max(15 - lowStockProducts * 3, 0)

	// Factor 3: Diversidad de actividades (máximo 15 puntos)
	const uniqueActivityTypes = new Set(activities.map((a: IActivity) => a.cropType)).size
	score += Math.min(uniqueActivityTypes * 3, 15)

	return Math.round(Math.min(score, 100))
}

export const getActivities = async (req: AuthenticatedRequest, res: Response) => {
	try {
		const userId = req.user?.userId
		if (!userId) {
			res.status(401).json({ message: 'Usuario no autenticado' })
			return
		}

		const page = parseInt(req.query.page as string) || 1
		const limit = parseInt(req.query.limit as string) || 10
		const skip = (page - 1) * limit

		const activities = await Activity.find({ userId })
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit)
			.lean()

		const total = await Activity.countDocuments({ userId })

		res.json({
      success: true,
			activities,
			pagination: {
				page,
				limit,
				total,
				pages: Math.ceil(total / limit)
			}
		})
	} catch (error) {
		console.error('Error getting activities:', error)
		res.status(500).json({ message: 'Error interno del servidor' })
	}
}

export const createActivity = async (req: AuthenticatedRequest, res: Response) => {
	try {
		const userId = req.user?.userId
		if (!userId) {
			res.status(401).json({ message: 'Usuario no autenticado' })
			return
		}

		const { 
			name, cropType, plantCount, area, areaUnit, transplantDate, sigpacReference,
			photos, fertigation, phytosanitary, waterEnergy,
			location, weather, notes, totalCost 
		} = req.body

		// Validaciones básicas
		if (!name || !cropType || area === undefined || totalCost === undefined) {
			res.status(400).json({ message: 'Faltan campos requeridos' })
			return
		}

		if (area <= 0 || totalCost < 0) {
			res.status(400).json({ message: 'Los valores no pueden ser negativos' })
			return
		}

		const activity = new Activity({
			userId,
			name,
			cropType,
			plantCount: plantCount || 0,
			area,
			areaUnit: areaUnit || 'ha',
			transplantDate,
			sigpacReference,
			photos: photos || [],
			fertigation: fertigation || { enabled: false },
			phytosanitary: phytosanitary || { enabled: false },
			waterEnergy: waterEnergy || { enabled: false },
			location,
			weather,
			notes,
			totalCost
		})

		await activity.save()

		res.status(201).json({
			success: true,
			message: 'Actividad creada exitosamente',
			activity
		})
  } catch (error) {
		console.error('Error creating activity:', error)
		res.status(500).json({ message: 'Error interno del servidor' })
	}
}

export const updateActivity = async (req: AuthenticatedRequest, res: Response) => {
	try {
		const userId = req.user?.userId
		const activityId = req.params.id
    
    if (!userId) {
			res.status(401).json({ message: 'Usuario no autenticado' })
			return
		}

		const { 
			name, cropType, plantCount, area, areaUnit, transplantDate, sigpacReference,
			photos, fertigation, phytosanitary, waterEnergy,
			location, weather, notes, totalCost 
		} = req.body

		// Validaciones básicas
		if (!name || !cropType || area === undefined || totalCost === undefined) {
			res.status(400).json({ message: 'Faltan campos requeridos' })
			return
		}

		if (area <= 0 || totalCost < 0) {
			res.status(400).json({ message: 'Los valores no pueden ser negativos' })
			return
		}

		const activity = await Activity.findOneAndUpdate(
			{ _id: activityId, userId },
			{
				name,
				cropType,
				plantCount: plantCount || 0,
				area,
				areaUnit: areaUnit || 'ha',
				transplantDate,
				sigpacReference,
				photos: photos || [],
				fertigation: fertigation || { enabled: false },
				phytosanitary: phytosanitary || { enabled: false },
				waterEnergy: waterEnergy || { enabled: false },
				location,
				weather,
				notes,
				totalCost,
				updatedAt: new Date()
			},
			{ new: true }
		)

		if (!activity) {
			res.status(404).json({ message: 'Actividad no encontrada' })
			return
		}

		res.json({
			success: true,
			message: 'Actividad actualizada exitosamente',
			activity
		})
	} catch (error) {
		console.error('Error updating activity:', error)
		res.status(500).json({ message: 'Error interno del servidor' })
	}
}

export const deleteActivity = async (req: AuthenticatedRequest, res: Response) => {
	try {
		const userId = req.user?.userId
		const activityId = req.params.id

		if (!userId) {
			res.status(401).json({ message: 'Usuario no autenticado' })
			return
		}

		const activity = await Activity.findOneAndDelete({ _id: activityId, userId })

		if (!activity) {
			res.status(404).json({ message: 'Actividad no encontrada' })
			return
		}

		res.json({
      success: true,
			message: 'Actividad eliminada exitosamente'
		})
	} catch (error) {
		console.error('Error deleting activity:', error)
		res.status(500).json({ message: 'Error interno del servidor' })
	}
}

export const getActivityById = async (req: AuthenticatedRequest, res: Response) => {
	try {
		const userId = req.user?.userId
		const activityId = req.params.id

		if (!userId) {
			res.status(401).json({ message: 'Usuario no autenticado' })
			return
		}

		const activity = await Activity.findOne({ _id: activityId, userId })

		if (!activity) {
			res.status(404).json({ message: 'Actividad no encontrada' })
			return
		}

		res.json({
			success: true,
			activity
		})
  } catch (error) {
		console.error('Error getting activity:', error)
		res.status(500).json({ message: 'Error interno del servidor' })
	}
}