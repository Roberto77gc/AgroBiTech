import { Request, Response } from 'express'
import InventoryProduct, { IInventoryProduct } from '../models/InventoryProduct'

// Definir la interfaz AuthenticatedRequest localmente
interface AuthenticatedRequest extends Request {
	user?: {
		userId: string
		email: string
		name: string
	}
}

export const getUserInventory = async (req: AuthenticatedRequest, res: Response) => {
	try {
		const userId = req.user?.userId
		if (!userId) {
			res.status(401).json({ message: 'Usuario no autenticado' })
			return
		}

		const products = await InventoryProduct.find({ userId }).sort({ createdAt: -1 }).lean()
		
		// Calcular estadísticas
		const totalProducts = products.length
		const lowStockProducts = products.filter((p: IInventoryProduct) => p.quantity <= p.minStock).length
		const totalValue = products.reduce((sum: number, p: IInventoryProduct) => sum + (p.quantity * p.price), 0)

		// Agrupar por categorías
		const categories = products.reduce((acc: Record<string, { count: number; value: number }>, product: IInventoryProduct) => {
			if (!acc[product.category]) {
				acc[product.category] = { count: 0, value: 0 }
			}
			acc[product.category].count++
			acc[product.category].value += product.quantity * product.price
			return acc
		}, {})

		res.json({
			success: true,
			products,
			stats: {
				totalProducts,
				lowStockProducts,
				totalValue,
				categories: Object.entries(categories).map(([category, data]) => ({
					category,
					count: data.count,
					value: data.value
				}))
			}
		})
	} catch (error) {
		console.error('Error getting user inventory:', error)
		res.status(500).json({ message: 'Error interno del servidor' })
	}
}

export const addProduct = async (req: AuthenticatedRequest, res: Response) => {
	try {
		const userId = req.user?.userId
		if (!userId) {
			res.status(401).json({ message: 'Usuario no autenticado' })
			return
		}

		const {
			name,
			category,
			description,
			quantity,
			unit,
			minStock,
			price,
			supplier,
			location,
			notes
		} = req.body

		// Validaciones
		if (!name || !category || quantity === undefined || minStock === undefined || price === undefined) {
			res.status(400).json({ message: 'Faltan campos requeridos' })
			return
		}

		if (quantity < 0 || minStock < 0 || price < 0) {
			res.status(400).json({ message: 'Los valores no pueden ser negativos' })
			return
		}

		const product = new InventoryProduct({
			userId,
			name,
			category,
			description,
			quantity,
			unit,
			minStock,
			price,
			supplier,
			location,
			notes
		})

		await product.save()

		res.status(201).json({
			success: true,
			message: 'Producto añadido exitosamente',
			product
		})
	} catch (error) {
		console.error('Error adding product:', error)
		res.status(500).json({ message: 'Error interno del servidor' })
	}
}

export const updateProduct = async (req: AuthenticatedRequest, res: Response) => {
	try {
		const userId = req.user?.userId
		const productId = req.params.id

		if (!userId) {
			res.status(401).json({ message: 'Usuario no autenticado' })
			return
		}

		const {
			name,
			category,
			description,
			quantity,
			unit,
			minStock,
			price,
			supplier,
			location,
			notes
		} = req.body

		// Validaciones
		if (!name || !category || quantity === undefined || minStock === undefined || price === undefined) {
			res.status(400).json({ message: 'Faltan campos requeridos' })
			return
		}

		if (quantity < 0 || minStock < 0 || price < 0) {
			res.status(400).json({ message: 'Los valores no pueden ser negativos' })
			return
		}

		const product = await InventoryProduct.findOneAndUpdate(
			{ _id: productId, userId },
			{
				name,
				category,
				description,
				quantity,
				unit,
				minStock,
				price,
				supplier,
				location,
				notes,
				updatedAt: new Date()
			},
			{ new: true }
		)

		if (!product) {
			res.status(404).json({ message: 'Producto no encontrado' })
			return
		}

		res.json({
			success: true,
			message: 'Producto actualizado exitosamente',
			product
		})
	} catch (error) {
		console.error('Error updating product:', error)
		res.status(500).json({ message: 'Error interno del servidor' })
	}
}

export const deleteProduct = async (req: AuthenticatedRequest, res: Response) => {
	try {
		const userId = req.user?.userId
		const productId = req.params.id

		if (!userId) {
			res.status(401).json({ message: 'Usuario no autenticado' })
			return
		}

		const product = await InventoryProduct.findOneAndDelete({ _id: productId, userId })

		if (!product) {
			res.status(404).json({ message: 'Producto no encontrado' })
			return
		}

		res.json({
			success: true,
			message: 'Producto eliminado exitosamente'
		})
	} catch (error) {
		console.error('Error deleting product:', error)
		res.status(500).json({ message: 'Error interno del servidor' })
	}
}

export const getLowStockProducts = async (req: AuthenticatedRequest, res: Response) => {
	try {
		const userId = req.user?.userId
		if (!userId) {
			res.status(401).json({ message: 'Usuario no autenticado' })
			return
		}

		const products = await InventoryProduct.find({
			userId,
			$expr: { $lte: ['$quantity', '$minStock'] }
		}).sort({ quantity: 1 }).lean()

		res.json({
			success: true,
			products,
			count: products.length
		})
	} catch (error) {
		console.error('Error getting low stock products:', error)
		res.status(500).json({ message: 'Error interno del servidor' })
	}
}

export const getInventoryStats = async (req: AuthenticatedRequest, res: Response) => {
	try {
		const userId = req.user?.userId
		if (!userId) {
			res.status(401).json({ message: 'Usuario no autenticado' })
			return
		}

		const products = await InventoryProduct.find({ userId }).lean()

		const totalProducts = products.length
		const lowStockProducts = products.filter((p: IInventoryProduct) => p.quantity <= p.minStock).length
		const totalValue = products.reduce((sum: number, p: IInventoryProduct) => sum + (p.quantity * p.price), 0)

		// Agrupar por categorías
		const categories = products.reduce((acc: Record<string, { count: number; value: number }>, product: IInventoryProduct) => {
			if (!acc[product.category]) {
				acc[product.category] = { count: 0, value: 0 }
			}
			acc[product.category].count++
			acc[product.category].value += product.quantity * product.price
			return acc
		}, {})

		res.json({
			success: true,
			stats: {
				totalProducts,
				lowStockProducts,
				totalValue,
				categories: Object.entries(categories).map(([category, data]) => ({
					category,
					count: data.count,
					value: data.value
				}))
			}
		})
	} catch (error) {
		console.error('Error getting inventory stats:', error)
		res.status(500).json({ message: 'Error interno del servidor' })
	}
} 