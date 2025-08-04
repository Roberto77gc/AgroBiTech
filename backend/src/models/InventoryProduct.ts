import mongoose, { Schema } from 'mongoose';

export interface IInventoryProduct {
  _id: string;
  userId: string;
  name: string;
  category: string;
  description?: string;
  quantity: number;
  unit: string;
  minStock: number;
  price: number;
  supplier?: string;
  location?: string;
  expiryDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InventoryProductSchema = new Schema<IInventoryProduct>({
  userId: {
    type: String,
    required: [true, 'User ID is required'],
    index: true
  },
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    enum: ['fertilizantes', 'fitosanitarios', 'semillas', 'herramientas', 'maquinaria', 'combustible', 'otros']
  },
  description: {
    type: String,
    trim: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative']
  },
  unit: {
    type: String,
    required: [true, 'Unit is required'],
    trim: true
  },
  minStock: {
    type: Number,
    default: 0,
    min: [0, 'Minimum stock cannot be negative']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  supplier: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  expiryDate: {
    type: Date
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  versionKey: false
});

// Indexes for better performance
InventoryProductSchema.index({ userId: 1, category: 1 });
InventoryProductSchema.index({ userId: 1, name: 1 });
InventoryProductSchema.index({ userId: 1, quantity: 1 });

const InventoryProduct = mongoose.model<IInventoryProduct>('InventoryProduct', InventoryProductSchema);

export default InventoryProduct; 