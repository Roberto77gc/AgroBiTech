import mongoose, { Schema, Document } from 'mongoose'

export interface ITemplate extends Document {
  userId: string
  name: string
  type: 'fertigation' | 'phytosanitary'
  payload: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

const TemplateSchema = new Schema<ITemplate>({
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['fertigation', 'phytosanitary'], required: true, index: true },
  payload: { type: Schema.Types.Mixed, required: true },
}, { timestamps: true })

TemplateSchema.index({ userId: 1, name: 1, type: 1 }, { unique: true })

export default mongoose.model<ITemplate>('Template', TemplateSchema)


