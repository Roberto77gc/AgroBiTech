import mongoose, { Schema, Document } from 'mongoose'

export interface IInventoryItem extends Document {
	userId: string
	productId: string
	productName: string
	productType: 'fertilizer' | 'water' | 'phytosanitary'
	currentStock: number
	minStock: number
	criticalStock: number
	unit: string
	location: string
	expiryDate?: string
	lastUpdated: Date
	active: boolean
	createdAt: Date
	updatedAt: Date
}

const InventoryItemSchema = new Schema<IInventoryItem>({
	userId: {
		type: String,
		required: true,
		index: true
	},
	productId: {
		type: String,
		required: false
	},
	productName: {
		type: String,
		required: true
	},
	productType: {
		type: String,
		enum: ['fertilizer', 'water', 'phytosanitary'],
		required: true
	},
	currentStock: {
		type: Number,
		required: true,
		min: 0
	},
	minStock: {
		type: Number,
		required: true,
		min: 0
	},
	criticalStock: {
		type: Number,
		required: true,
		min: 0
	},
	unit: {
		type: String,
		required: true
	},
	location: {
		type: String,
		required: true
	},
	expiryDate: {
		type: String
	},
	lastUpdated: {
		type: Date,
		default: Date.now
	},
	active: {
		type: Boolean,
		default: true
	}
}, {
	timestamps: true
})

// Índices para mejorar rendimiento
InventoryItemSchema.index({ userId: 1, productId: 1 })
InventoryItemSchema.index({ userId: 1, active: 1 })
InventoryItemSchema.index({ userId: 1, productType: 1 })

export default mongoose.model<IInventoryItem>('InventoryItem', InventoryItemSchema) 