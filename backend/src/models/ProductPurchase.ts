import mongoose, { Schema, Document } from 'mongoose'

export interface IProductPurchase extends Document {
	userId: string
	productId: string
	productName: string
	brand: string
	supplier: string
	purchaseDate: string
	pricePerUnit: number
	quantity: number
	totalCost: number
	unit: string
	notes?: string
	createdAt: Date
	updatedAt: Date
}

const ProductPurchaseSchema = new Schema<IProductPurchase>({
	userId: {
		type: String,
		required: true,
		index: true
	},
	productId: {
		type: String,
		required: true
	},
	productName: {
		type: String,
		required: true
	},
	brand: {
		type: String,
		required: true
	},
	supplier: {
		type: String,
		required: true
	},
	purchaseDate: {
		type: String,
		required: true
	},
	pricePerUnit: {
		type: Number,
		required: true,
		min: 0
	},
	quantity: {
		type: Number,
		required: true,
		min: 0
	},
	totalCost: {
		type: Number,
		required: true,
		min: 0
	},
	unit: {
		type: String,
		required: true
	},
	notes: {
		type: String
	}
}, {
	timestamps: true
})

// Índices para mejorar rendimiento
ProductPurchaseSchema.index({ userId: 1, productId: 1 })
ProductPurchaseSchema.index({ userId: 1, supplier: 1 })
ProductPurchaseSchema.index({ userId: 1, purchaseDate: 1 })

export default mongoose.model<IProductPurchase>('ProductPurchase', ProductPurchaseSchema) 