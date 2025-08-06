import mongoose, { Schema, Document } from 'mongoose'

export interface IInventoryAlert extends Document {
	userId: string
	itemId: string
	productName: string
	type: 'low_stock' | 'critical_stock' | 'expiry_warning'
	message: string
	severity: 'warning' | 'critical'
	read: boolean
	createdAt: Date
	updatedAt: Date
}

const InventoryAlertSchema = new Schema<IInventoryAlert>({
	userId: {
		type: String,
		required: true,
		index: true
	},
	itemId: {
		type: String,
		required: true
	},
	productName: {
		type: String,
		required: true
	},
	type: {
		type: String,
		enum: ['low_stock', 'critical_stock', 'expiry_warning'],
		required: true
	},
	message: {
		type: String,
		required: true
	},
	severity: {
		type: String,
		enum: ['warning', 'critical'],
		required: true
	},
	read: {
		type: Boolean,
		default: false
	}
}, {
	timestamps: true
})

// Índices para mejorar rendimiento
InventoryAlertSchema.index({ userId: 1, read: 1 })
InventoryAlertSchema.index({ userId: 1, itemId: 1 })
InventoryAlertSchema.index({ userId: 1, severity: 1 })

export default mongoose.model<IInventoryAlert>('InventoryAlert', InventoryAlertSchema) 