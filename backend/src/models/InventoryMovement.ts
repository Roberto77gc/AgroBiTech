import mongoose, { Schema, Document } from 'mongoose'

export interface IInventoryMovement extends Document {
  userId: mongoose.Types.ObjectId | string
  inventoryItemId: mongoose.Types.ObjectId | string
  productId: string
  productName?: string
  operation: 'add' | 'subtract'
  amount: number
  unit: string
  amountInItemUnit: number
  balanceAfter: number
  reason?: string
  activityId?: string
  module?: 'fertigation' | 'phytosanitary' | 'water'
  dayIndex?: number
  createdAt: Date
}

const InventoryMovementSchema = new Schema<IInventoryMovement>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  inventoryItemId: { type: Schema.Types.ObjectId, ref: 'InventoryItem', required: true, index: true },
  productId: { type: String, required: true, index: true },
  productName: { type: String, trim: true },
  operation: { type: String, enum: ['add', 'subtract'], required: true },
  amount: { type: Number, required: true, min: 0 },
  unit: { type: String, required: true },
  amountInItemUnit: { type: Number, required: true, min: 0 },
  balanceAfter: { type: Number, required: true, min: 0 },
  reason: { type: String, trim: true },
  activityId: { type: String, index: true },
  module: { type: String, enum: ['fertigation', 'phytosanitary', 'water'] },
  dayIndex: { type: Number, min: 0 },
}, { timestamps: { createdAt: true, updatedAt: false }, collection: 'inventory_movements' })

InventoryMovementSchema.index({ userId: 1, activityId: 1, module: 1, dayIndex: 1, createdAt: 1 })

const InventoryMovement = mongoose.model<IInventoryMovement>('InventoryMovement', InventoryMovementSchema)

export default InventoryMovement


