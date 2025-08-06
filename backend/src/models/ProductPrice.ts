import mongoose, { Schema, Document } from 'mongoose'

export interface IProductPrice extends Document {
	userId: string
	name: string
	type: 'fertilizer' | 'water' | 'phytosanitary'
	pricePerUnit: number
	unit: string
	category?: string
	description?: string
	active: boolean
	createdAt: Date
	updatedAt: Date
}

const ProductPriceSchema = new Schema<IProductPrice>({
	userId: {
		type: String,
		required: true,
		index: true
	},
	name: {
		type: String,
		required: true
	},
	type: {
		type: String,
		enum: ['fertilizer', 'water', 'phytosanitary'],
		required: true
	},
	pricePerUnit: {
		type: Number,
		required: true,
		min: 0
	},
	unit: {
		type: String,
		required: true
	},
	category: {
		type: String
	},
	description: {
		type: String
	},
	active: {
		type: Boolean,
		default: true
	}
}, {
	timestamps: true
})

// Índices para mejorar rendimiento
ProductPriceSchema.index({ userId: 1, type: 1 })
ProductPriceSchema.index({ userId: 1, active: 1 })

export default mongoose.model<IProductPrice>('ProductPrice', ProductPriceSchema) 