import mongoose, { Schema, Document } from 'mongoose'

export interface ISupplier extends Document {
	userId: string
	name: string
	contactPerson?: string
	phone?: string
	email?: string
	address?: string
	website?: string
	rating?: number
	notes?: string
	active: boolean
	createdAt: Date
	updatedAt: Date
}

const SupplierSchema = new Schema<ISupplier>({
	userId: {
		type: String,
		required: true,
		index: true
	},
	name: {
		type: String,
		required: true
	},
	contactPerson: {
		type: String
	},
	phone: {
		type: String
	},
	email: {
		type: String
	},
	address: {
		type: String
	},
	website: {
		type: String
	},
	rating: {
		type: Number,
		min: 1,
		max: 5
	},
	notes: {
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
SupplierSchema.index({ userId: 1, active: 1 })

export default mongoose.model<ISupplier>('Supplier', SupplierSchema) 