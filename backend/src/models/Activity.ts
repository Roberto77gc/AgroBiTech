import mongoose, { Schema } from 'mongoose';
import { IActivityRecord, IProductUsed, ISubActivityRecord } from '../types';

const ProductUsedSchema = new Schema<IProductUsed>({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  dose: {
    type: Number,
    required: [true, 'Product dose is required'],
    min: [0, 'Dose cannot be negative']
  },
  pricePerUnit: {
    type: Number,
    required: [true, 'Price per unit is required'],
    min: [0, 'Price cannot be negative']
  },
  unit: {
    type: String,
    enum: ['kg', 'l', 'g', 'ml'],
    required: [true, 'Unit is required']
  },
  category: {
    type: String,
    enum: ['fertilizer', 'pesticide', 'seed', 'other'],
    required: [true, 'Category is required']
  }
}, { _id: false });

const SubActivityRecordSchema = new Schema<ISubActivityRecord>({
  date: {
    type: String,
    required: [true, 'Date is required']
  },
  productos: [ProductUsedSchema],
  observaciones: {
    type: String,
    trim: true,
    maxlength: [500, 'Observations cannot exceed 500 characters']
  },
  coste: {
    type: Number,
    required: [true, 'Cost is required'],
    min: [0, 'Cost cannot be negative']
  }
}, { timestamps: true });

const ActivityRecordSchema = new Schema<IActivityRecord>({
  userId: {
    type: String,
    required: [true, 'User ID is required'],
    index: true
  },
  date: {
    type: String,
    required: [true, 'Date is required']
  },
  name: {
    type: String,
    required: [true, 'Activity name is required'],
    trim: true,
    maxlength: [100, 'Activity name cannot exceed 100 characters']
  },
  cropType: {
    type: String,
    required: [true, 'Crop type is required'],
    trim: true
  },
  variety: {
    type: String,
    required: [true, 'Variety is required'],
    trim: true
  },
  transplantDate: {
    type: String,
    required: [true, 'Transplant date is required']
  },
  plantsCount: {
    type: Number,
    required: [true, 'Plants count is required'],
    min: [1, 'Plants count must be at least 1']
  },
  surfaceArea: {
    type: Number,
    required: [true, 'Surface area is required'],
    min: [0.01, 'Surface area must be greater than 0']
  },
  waterUsed: {
    type: Number,
    required: [true, 'Water used is required'],
    min: [0, 'Water used cannot be negative']
  },
  products: [ProductUsedSchema],
  location: {
    lat: {
      type: Number,
      required: [true, 'Latitude is required'],
      min: [-90, 'Invalid latitude'],
      max: [90, 'Invalid latitude']
    },
    lng: {
      type: Number,
      required: [true, 'Longitude is required'],
      min: [-180, 'Invalid longitude'],
      max: [180, 'Invalid longitude']
    }
  },
  totalCost: {
    type: Number,
    required: [true, 'Total cost is required'],
    min: [0, 'Total cost cannot be negative']
  },
  costPerHectare: {
    type: Number,
    required: [true, 'Cost per hectare is required'],
    min: [0, 'Cost per hectare cannot be negative']
  },
  sigpac: {
    refCatastral: {
      type: String,
      trim: true
    },
    poligono: {
      type: String,
      trim: true
    },
    parcela: {
      type: String,
      trim: true
    },
    recinto: {
      type: String,
      trim: true
    }
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  fertirriego: [SubActivityRecordSchema]
}, {
  timestamps: true,
  versionKey: false
});

// Indexes for better performance
ActivityRecordSchema.index({ userId: 1, date: -1 });
ActivityRecordSchema.index({ userId: 1, cropType: 1 });
ActivityRecordSchema.index({ createdAt: -1 });

// Calculate total cost before saving
ActivityRecordSchema.pre('save', function(next) {
  // Calculate total cost from products if not provided
  if (this.products && this.products.length > 0) {
    const productsCost = this.products.reduce((total, product) => {
      return total + (product.dose * product.pricePerUnit);
    }, 0);
    
    // Add fertirriego costs
    const fertiriegoCost = this.fertirriego.reduce((total, fertirriego) => {
      return total + fertirriego.coste;
    }, 0);
    
    this.totalCost = productsCost + fertiriegoCost;
    this.costPerHectare = this.surfaceArea > 0 ? this.totalCost / this.surfaceArea : 0;
  }
  
  next();
});

const Activity = mongoose.model<IActivityRecord>('Activity', ActivityRecordSchema);

export default Activity;