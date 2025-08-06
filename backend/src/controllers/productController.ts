import { Request, Response } from 'express'
import ProductPrice from '../models/ProductPrice'

// Obtener todos los productos del usuario
export const getProducts = async (req: Request, res: Response) => {
	try {
		const userId = (req as any).user.userId
		const products = await ProductPrice.find({ userId, active: true })
		return res.json({ success: true, products })
	} catch (error) {
		console.error('Error getting products:', error)
		return res.status(500).json({ success: false, message: 'Error interno del servidor' })
	}
}

// Obtener productos por tipo
export const getProductsByType = async (req: Request, res: Response) => {
	try {
		const userId = (req as any).user.userId
		const { type } = req.params
		
		if (!['fertilizer', 'water', 'phytosanitary'].includes(type)) {
			return res.status(400).json({ success: false, message: 'Tipo de producto inválido' })
		}
		
		const products = await ProductPrice.find({ userId, type, active: true })
		return res.json({ success: true, products })
	} catch (error) {
		console.error('Error getting products by type:', error)
		return res.status(500).json({ success: false, message: 'Error interno del servidor' })
	}
}

// Crear nuevo producto
export const createProduct = async (req: Request, res: Response) => {
	try {
		const userId = (req as any).user.userId
		const productData = { ...req.body, userId }
		
		const product = new ProductPrice(productData)
		await product.save()
		
		return res.status(201).json({ success: true, product })
	} catch (error) {
		console.error('Error creating product:', error)
		return res.status(500).json({ success: false, message: 'Error interno del servidor' })
	}
}

// Actualizar producto
export const updateProduct = async (req: Request, res: Response) => {
	try {
		const userId = (req as any).user.userId
		const { id } = req.params
		
		const product = await ProductPrice.findOneAndUpdate(
			{ _id: id, userId },
			req.body,
			{ new: true, runValidators: true }
		)
		
		if (!product) {
			return res.status(404).json({ success: false, message: 'Producto no encontrado' })
		}
		
		return res.json({ success: true, product })
	} catch (error) {
		console.error('Error updating product:', error)
		return res.status(500).json({ success: false, message: 'Error interno del servidor' })
	}
}

// Eliminar producto (marcar como inactivo)
export const deleteProduct = async (req: Request, res: Response) => {
	try {
		const userId = (req as any).user.userId
		const { id } = req.params
		
		const product = await ProductPrice.findOneAndUpdate(
			{ _id: id, userId },
			{ active: false },
			{ new: true }
		)
		
		if (!product) {
			return res.status(404).json({ success: false, message: 'Producto no encontrado' })
		}
		
		return res.json({ success: true, message: 'Producto eliminado correctamente' })
	} catch (error) {
		console.error('Error deleting product:', error)
		return res.status(500).json({ success: false, message: 'Error interno del servidor' })
	}
} 