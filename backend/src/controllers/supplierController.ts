import { Request, Response } from 'express'
import Supplier from '../models/Supplier'

// Obtener todos los proveedores del usuario
export const getSuppliers = async (req: Request, res: Response) => {
	try {
		const userId = (req as any).user.userId
		const suppliers = await Supplier.find({ userId, active: true })
		return res.json({ success: true, suppliers })
	} catch (error) {
		console.error('Error getting suppliers:', error)
		return res.status(500).json({ success: false, message: 'Error interno del servidor' })
	}
}

// Obtener proveedor por ID
export const getSupplierById = async (req: Request, res: Response) => {
	try {
		const userId = (req as any).user.userId
		const { id } = req.params
		
		const supplier = await Supplier.findOne({ _id: id, userId, active: true })
		
		if (!supplier) {
			return res.status(404).json({ success: false, message: 'Proveedor no encontrado' })
		}
		
		return res.json({ success: true, supplier })
	} catch (error) {
		console.error('Error getting supplier:', error)
		return res.status(500).json({ success: false, message: 'Error interno del servidor' })
	}
}

// Crear nuevo proveedor
export const createSupplier = async (req: Request, res: Response) => {
	try {
		const userId = (req as any).user.userId
		const supplierData = { ...req.body, userId }
		
		const supplier = new Supplier(supplierData)
		await supplier.save()
		
		return res.status(201).json({ success: true, supplier })
	} catch (error) {
		console.error('Error creating supplier:', error)
		return res.status(500).json({ success: false, message: 'Error interno del servidor' })
	}
}

// Actualizar proveedor
export const updateSupplier = async (req: Request, res: Response) => {
	try {
		const userId = (req as any).user.userId
		const { id } = req.params
		
		const supplier = await Supplier.findOneAndUpdate(
			{ _id: id, userId },
			req.body,
			{ new: true, runValidators: true }
		)
		
		if (!supplier) {
			return res.status(404).json({ success: false, message: 'Proveedor no encontrado' })
		}
		
		return res.json({ success: true, supplier })
	} catch (error) {
		console.error('Error updating supplier:', error)
		return res.status(500).json({ success: false, message: 'Error interno del servidor' })
	}
}

// Eliminar proveedor (marcar como inactivo)
export const deleteSupplier = async (req: Request, res: Response) => {
	try {
		const userId = (req as any).user.userId
		const { id } = req.params
		
		const supplier = await Supplier.findOneAndUpdate(
			{ _id: id, userId },
			{ active: false },
			{ new: true }
		)
		
		if (!supplier) {
			return res.status(404).json({ success: false, message: 'Proveedor no encontrado' })
		}
		
		return res.json({ success: true, message: 'Proveedor eliminado correctamente' })
	} catch (error) {
		console.error('Error deleting supplier:', error)
		return res.status(500).json({ success: false, message: 'Error interno del servidor' })
	}
} 