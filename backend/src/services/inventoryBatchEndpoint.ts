import { Request, Response } from 'express'
import InventoryItem from '../models/InventoryItem'

export const getInventoryByProducts = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId
    const idsParam = (req.query.ids as string) || ''
    const ids = idsParam.split(',').map(s => s.trim()).filter(Boolean)
    if (!userId || ids.length === 0) return res.json({ success: true, items: [] })
    const items = await InventoryItem.find({ userId, productId: { $in: ids }, active: true }).lean()
    // Mapear productId->item básico para el frontend
    const map: Record<string, any> = {}
    for (const it of items) {
      map[it.productId] = { _id: String(it._id), productId: it.productId, currentStock: it.currentStock, unit: it.unit }
    }
    return res.json({ success: true, items: map })
  } catch (e) {
    console.error('Error in getInventoryByProducts:', e)
    return res.status(500).json({ success: false, message: 'Error interno del servidor' })
  }
}


