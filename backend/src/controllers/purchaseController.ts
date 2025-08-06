import { Request, Response } from 'express'
import ProductPurchase from '../models/ProductPurchase'

// Obtener todas las compras del usuario
export const getPurchases = async (req: Request, res: Response) => {
	try {
		const userId = (req as any).user.userId
		const purchases = await ProductPurchase.find({ userId }).sort({ purchaseDate: -1 })
		return res.json({ success: true, purchases })
	} catch (error) {
		console.error('Error getting purchases:', error)
		return res.status(500).json({ success: false, message: 'Error interno del servidor' })
	}
}

// Obtener compras por producto
export const getPurchasesByProduct = async (req: Request, res: Response) => {
	try {
		const userId = (req as any).user.userId
		const { productId } = req.params
		
		const purchases = await ProductPurchase.find({ userId, productId }).sort({ purchaseDate: -1 })
		return res.json({ success: true, purchases })
	} catch (error) {
		console.error('Error getting purchases by product:', error)
		return res.status(500).json({ success: false, message: 'Error interno del servidor' })
	}
}

// Obtener compras por proveedor
export const getPurchasesBySupplier = async (req: Request, res: Response) => {
	try {
		const userId = (req as any).user.userId
		const { supplier } = req.params
		
		const purchases = await ProductPurchase.find({ userId, supplier }).sort({ purchaseDate: -1 })
		return res.json({ success: true, purchases })
	} catch (error) {
		console.error('Error getting purchases by supplier:', error)
		return res.status(500).json({ success: false, message: 'Error interno del servidor' })
	}
}

// Crear nueva compra
export const createPurchase = async (req: Request, res: Response) => {
	try {
		const userId = (req as any).user.userId
		const purchaseData = { ...req.body, userId }
		
		const purchase = new ProductPurchase(purchaseData)
		await purchase.save()
		
		return res.status(201).json({ success: true, purchase })
	} catch (error) {
		console.error('Error creating purchase:', error)
		return res.status(500).json({ success: false, message: 'Error interno del servidor' })
	}
}

// Actualizar compra
export const updatePurchase = async (req: Request, res: Response) => {
	try {
		const userId = (req as any).user.userId
		const { id } = req.params
		
		const purchase = await ProductPurchase.findOneAndUpdate(
			{ _id: id, userId },
			req.body,
			{ new: true, runValidators: true }
		)
		
		if (!purchase) {
			return res.status(404).json({ success: false, message: 'Compra no encontrada' })
		}
		
		return res.json({ success: true, purchase })
	} catch (error) {
		console.error('Error updating purchase:', error)
		return res.status(500).json({ success: false, message: 'Error interno del servidor' })
	}
}

// Eliminar compra
export const deletePurchase = async (req: Request, res: Response) => {
	try {
		const userId = (req as any).user.userId
		const { id } = req.params
		
		const purchase = await ProductPurchase.findOneAndDelete({ _id: id, userId })
		
		if (!purchase) {
			return res.status(404).json({ success: false, message: 'Compra no encontrada' })
		}
		
		return res.json({ success: true, message: 'Compra eliminada correctamente' })
	} catch (error) {
		console.error('Error deleting purchase:', error)
		return res.status(500).json({ success: false, message: 'Error interno del servidor' })
	}
} 