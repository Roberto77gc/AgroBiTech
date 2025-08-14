import { Request, Response } from 'express'
import InventoryItem from '../models/InventoryItem'
import InventoryAlert from '../models/InventoryAlert'
import ProductPrice from '../models/ProductPrice'
import InventoryProduct from '../models/InventoryProduct'
import { convertAmount } from '../services/inventoryService'
import InventoryMovement from '../models/InventoryMovement'

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
		
		let item = await InventoryItem.findOne({ productId, userId, active: true })
		
    if (!item) {
      // Fallback 1: existe un InventoryItem activo con el MISMO nombre de producto (pero sin productId asignado)
      try {
        const product = await ProductPrice.findOne({ _id: productId, userId })
        if (product) {
          const byName = await InventoryItem.findOne({ userId, productName: product.name, active: true })
          if (byName) {
            // Enlazar definitivamente al productId correcto y normalizar algunos campos
            byName.productId = productId
            byName.productType = product.type as any
            byName.unit = byName.unit || product.unit || 'kg'
            byName.lastUpdated = new Date()
            await byName.save()
            item = byName
          } else {
            // Fallback 2: intentar migrar desde el modelo antiguo InventoryProduct usando el nombre del producto
            const legacy = await InventoryProduct.findOne({ userId, name: product.name })
            if (legacy) {
              const migrated = new InventoryItem({
                userId,
                productId,
                productName: product.name,
                productType: product.type,
                currentStock: legacy.quantity || 0,
                minStock: legacy.minStock || 0,
                criticalStock: Math.max(Math.floor((legacy.minStock || 0) / 2), 0),
                unit: legacy.unit || product.unit || 'kg',
                location: 'almacén',
                active: true,
                lastUpdated: new Date()
              })
              await migrated.save()
              item = migrated
            }
          }
        }
      } catch (migrationError) {
        console.warn('No se pudo resolver inventario por nombre/migración:', (migrationError as Error).message)
      }
    }
		
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
    const { quantity, operation, unit } = req.body
		
		const item = await InventoryItem.findOne({ _id: id, userId, active: true })
		
		if (!item) {
			return res.status(404).json({ success: false, message: 'Item de inventario no encontrado' })
		}
		
    // Convertir cantidad a la unidad del item si se especificó otra unidad
    const qtyInItemUnit = convertAmount(Number(quantity) || 0, unit || item.unit, item.unit)
    const newStock = operation === 'add' 
      ? item.currentStock + qtyInItemUnit 
      : item.currentStock - qtyInItemUnit
		
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

// Listar movimientos de inventario con filtros básicos
export const listMovements = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId
    const { productId, activityId, module, from, to, page = '1', limit = '20' } = req.query as Record<string, string>
    const q: any = { userId }
    if (productId) q.productId = productId
    if (activityId) q.activityId = activityId
    if (module) q.module = module
    if (from || to) {
      q.createdAt = {}
      if (from) q.createdAt.$gte = new Date(from)
      if (to) q.createdAt.$lte = new Date(to)
    }
    const pageNum = Math.max(parseInt(page || '1'), 1)
    const limitNum = Math.min(Math.max(parseInt(limit || '20'), 1), 100)
    const skip = (pageNum - 1) * limitNum
    const [items, total] = await Promise.all([
      InventoryMovement.find(q).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      InventoryMovement.countDocuments(q)
    ])
    return res.json({ success: true, items, pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) } })
  } catch (e) {
    console.error('Error listing movements:', e)
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

// Migración: mover inventario antiguo (InventoryProduct) a InventoryItem enlazado por productId
export const migrateLegacyInventory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId
    const locationDefault = (req.body && req.body.location) || 'almacén'

    // Obtener todos los productos de precios para mapear nombre -> _id
    const prices = await ProductPrice.find({ userId, active: true }).lean()
    const nameToProduct = new Map<string, any>()
    for (const p of prices) {
      nameToProduct.set(p.name, p)
    }

    const legacyItems = await InventoryProduct.find({ userId }).lean()

    const summary = {
      totalLegacy: legacyItems.length,
      migrated: 0,
      updated: 0,
      skippedNoProductMatch: 0,
      skippedAlreadyExists: 0,
      details: [] as Array<{ name: string; action: string; reason?: string }>
    }

    const categoryMap: Record<string, 'fertilizer' | 'phytosanitary' | 'water'> = {
      fertilizer: 'fertilizer',
      pesticide: 'phytosanitary',
      water: 'water',
    }

    for (const legacy of legacyItems) {
      const legacyName = legacy.name
      const matched = nameToProduct.get(legacyName)
      if (!matched) {
        summary.skippedNoProductMatch++
        summary.details.push({ name: legacyName, action: 'skip', reason: 'No hay ProductPrice con ese nombre' })
        continue
      }

      const productId = String(matched._id)
      const existing = await InventoryItem.findOne({ userId, productId, active: true })
      const unit = legacy.unit || matched.unit || 'kg'
      const productType = (matched.type || categoryMap[legacy.category] || 'fertilizer') as 'fertilizer' | 'phytosanitary' | 'water'

      if (!existing) {
        const created = new InventoryItem({
          userId,
          productId,
          productName: matched.name,
          productType,
          currentStock: legacy.quantity || 0,
          minStock: legacy.minStock || 0,
          criticalStock: Math.max(Math.floor((legacy.minStock || 0) / 2), 0),
          unit,
          location: locationDefault,
          active: true,
          lastUpdated: new Date(),
        })
        await created.save()
        summary.migrated++
        summary.details.push({ name: legacyName, action: 'migrated' })
      } else {
        // Si ya existe, opcionalmente podemos sincronizar minStock y unit
        const nextMin = legacy.minStock ?? existing.minStock
        const nextUnit = unit || existing.unit
        if (nextMin !== existing.minStock || nextUnit !== existing.unit) {
          existing.minStock = nextMin
          existing.unit = nextUnit
          existing.lastUpdated = new Date()
          await existing.save()
          summary.updated++
          summary.details.push({ name: legacyName, action: 'updated' })
        } else {
          summary.skippedAlreadyExists++
          summary.details.push({ name: legacyName, action: 'skip', reason: 'Ya existía InventoryItem' })
        }
      }
    }

    return res.json({ success: true, summary })
  } catch (error) {
    console.error('Error migrating legacy inventory:', error)
    return res.status(500).json({ success: false, message: 'Error interno durante la migración' })
  }
}