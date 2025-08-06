import { Request, Response } from 'express'
import InventoryItem from '../models/InventoryItem'
import InventoryAlert from '../models/InventoryAlert'

// Obtener todos los items de inventario del usuario
export const getInventoryItems = async (req: Request, res: Response) => {
	try {
		const userId = (req as any).user.userId
		const items = await InventoryItem.find({ userId, active: true })
		return res.json({ success: true, items })
	} catch (error) {
		console.error('Error getting inventory items:', error)
		return res.status(500).json({ success: false, message: 'Error interno del servidor' })
	}
}

// Obtener item de inventario por ID
export const getInventoryItemById = async (req: Request, res: Response) => {
	try {
		const userId = (req as any).user.userId
		const { id } = req.params
		
		const item = await InventoryItem.findOne({ _id: id, userId, active: true })
		
		if (!item) {
			return res.status(404).json({ success: false, message: 'Item de inventario no encontrado' })
		}
		
		return res.json({ success: true, item })
	} catch (error) {
		console.error('Error getting inventory item:', error)
		return res.status(500).json({ success: false, message: 'Error interno del servidor' })
	}
}

// Obtener item de inventario por producto
export const getInventoryItemByProduct = async (req: Request, res: Response) => {
	try {
		const userId = (req as any).user.userId
		const { productId } = req.params
		
		const item = await InventoryItem.findOne({ productId, userId, active: true })
		
		if (!item) {
			return res.status(404).json({ success: false, message: 'Item de inventario no encontrado para este producto' })
		}
		
		return res.json({ success: true, item })
	} catch (error) {
		console.error('Error getting inventory item by product:', error)
		return res.status(500).json({ success: false, message: 'Error interno del servidor' })
	}
}

// Crear nuevo item de inventario
export const createInventoryItem = async (req: Request, res: Response) => {
	try {
		const userId = (req as any).user.userId
		const itemData = { ...req.body, userId }
		
		const item = new InventoryItem(itemData)
		await item.save()
		
		// Verificar alertas después de crear
		await checkInventoryAlerts(item)
		
		return res.status(201).json({ success: true, item })
	} catch (error) {
		console.error('Error creating inventory item:', error)
		return res.status(500).json({ success: false, message: 'Error interno del servidor' })
	}
}

// Actualizar item de inventario
export const updateInventoryItem = async (req: Request, res: Response) => {
	try {
		const userId = (req as any).user.userId
		const { id } = req.params
		
		const item = await InventoryItem.findOneAndUpdate(
			{ _id: id, userId },
			{ ...req.body, lastUpdated: new Date() },
			{ new: true, runValidators: true }
		)
		
		if (!item) {
			return res.status(404).json({ success: false, message: 'Item de inventario no encontrado' })
		}
		
		// Verificar alertas después de actualizar
		await checkInventoryAlerts(item)
		
		return res.json({ success: true, item })
	} catch (error) {
		console.error('Error updating inventory item:', error)
		return res.status(500).json({ success: false, message: 'Error interno del servidor' })
	}
}

// Eliminar item de inventario (marcar como inactivo)
export const deleteInventoryItem = async (req: Request, res: Response) => {
	try {
		const userId = (req as any).user.userId
		const { id } = req.params
		
		const item = await InventoryItem.findOneAndUpdate(
			{ _id: id, userId },
			{ active: false },
			{ new: true }
		)
		
		if (!item) {
			return res.status(404).json({ success: false, message: 'Item de inventario no encontrado' })
		}
		
		return res.json({ success: true, message: 'Item de inventario eliminado correctamente' })
	} catch (error) {
		console.error('Error deleting inventory item:', error)
		return res.status(500).json({ success: false, message: 'Error interno del servidor' })
	}
}

// Ajustar stock
export const adjustStock = async (req: Request, res: Response) => {
	try {
		const userId = (req as any).user.userId
		const { id } = req.params
		const { quantity, operation } = req.body
		
		const item = await InventoryItem.findOne({ _id: id, userId, active: true })
		
		if (!item) {
			return res.status(404).json({ success: false, message: 'Item de inventario no encontrado' })
		}
		
		const newStock = operation === 'add' 
			? item.currentStock + quantity 
			: item.currentStock - quantity
		
		if (newStock < 0) {
			return res.status(400).json({ success: false, message: 'Stock no puede ser negativo' })
		}
		
		item.currentStock = newStock
		item.lastUpdated = new Date()
		await item.save()
		
		// Verificar alertas después del ajuste
		await checkInventoryAlerts(item)
		
		return res.json({ success: true, item })
	} catch (error) {
		console.error('Error adjusting stock:', error)
		return res.status(500).json({ success: false, message: 'Error interno del servidor' })
	}
}

// Obtener alertas activas
export const getAlerts = async (req: Request, res: Response) => {
	try {
		const userId = (req as any).user.userId
		const alerts = await InventoryAlert.find({ userId, read: false }).sort({ createdAt: -1 })
		return res.json({ success: true, alerts })
	} catch (error) {
		console.error('Error getting alerts:', error)
		return res.status(500).json({ success: false, message: 'Error interno del servidor' })
	}
}

// Marcar alerta como leída
export const markAlertAsRead = async (req: Request, res: Response) => {
	try {
		const userId = (req as any).user.userId
		const { alertId } = req.params
		
		const alert = await InventoryAlert.findOneAndUpdate(
			{ _id: alertId, userId },
			{ read: true },
			{ new: true }
		)
		
		if (!alert) {
			return res.status(404).json({ success: false, message: 'Alerta no encontrada' })
		}
		
		return res.json({ success: true, alert })
	} catch (error) {
		console.error('Error marking alert as read:', error)
		return res.status(500).json({ success: false, message: 'Error interno del servidor' })
	}
}

// Función para verificar alertas de inventario
const checkInventoryAlerts = async (item: any) => {
	try {
		// Limpiar alertas existentes para este item
		await InventoryAlert.deleteMany({ itemId: item._id.toString() })
		
		// Verificar stock crítico
		if (item.currentStock <= item.criticalStock) {
			const criticalAlert = new InventoryAlert({
				userId: item.userId,
				itemId: item._id.toString(),
				productName: item.productName,
				type: 'critical_stock',
				message: `Stock crítico: ${item.productName} - Solo quedan ${item.currentStock} ${item.unit}`,
				severity: 'critical'
			})
			await criticalAlert.save()
		}
		// Verificar stock bajo
		else if (item.currentStock <= item.minStock) {
			const lowStockAlert = new InventoryAlert({
				userId: item.userId,
				itemId: item._id.toString(),
				productName: item.productName,
				type: 'low_stock',
				message: `Stock bajo: ${item.productName} - Quedan ${item.currentStock} ${item.unit}`,
				severity: 'warning'
			})
			await lowStockAlert.save()
		}
		
		// Verificar caducidad (si tiene fecha de vencimiento)
		if (item.expiryDate) {
			const expiryDate = new Date(item.expiryDate)
			const today = new Date()
			const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
			
			if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
				const expiryAlert = new InventoryAlert({
					userId: item.userId,
					itemId: item._id.toString(),
					productName: item.productName,
					type: 'expiry_warning',
					message: `Caducidad próxima: ${item.productName} - Caduca en ${daysUntilExpiry} días`,
					severity: 'warning'
				})
				await expiryAlert.save()
			}
		}
	} catch (error) {
		console.error('Error checking inventory alerts:', error)
	}
} 