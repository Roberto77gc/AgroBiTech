import mongoose, { Schema, Document } from 'mongoose';

// Interfaces para tipado TypeScript
export interface IFertilizerRecord {
  fertilizerType: string;
  fertilizerAmount: number;
  fertilizerUnit: string;
  cost: number;
  productId?: string;
  pricePerUnit?: number;
  brand?: string;
  supplier?: string;
  purchaseDate?: string;
  notes?: string;
}

export interface IDailyFertigationRecord {
  date: string;
  fertilizers: IFertilizerRecord[];
  waterConsumption: number;
  waterUnit: string;
  totalCost: number;
  notes?: string;
}

export interface IFertigationData {
  enabled: boolean;
  dailyRecords: IDailyFertigationRecord[];
  notes?: string;
}

export interface IPhytosanitaryData {
  enabled: boolean;
  treatmentType?: string;
  productName?: string;
  applicationDate?: string;
  dosage?: string;
  notes?: string;
}

export interface IWaterData {
  enabled: boolean;
  waterSource?: string;
  irrigationType?: string;
  dailyConsumption?: number;
  waterUnit?: string;
  cost?: number;
  notes?: string;
}

export interface IEnergyData {
  enabled: boolean;
  energyType?: string;
  dailyConsumption?: number;
  energyUnit?: string;
  cost?: number;
  notes?: string;
}

export interface IActivity extends Document {
  _id: string;
  userId: mongoose.Types.ObjectId;
  
  // Información básica
  name: string;
  cropType: string;
  plantCount?: number;
  area: number;
  areaUnit: 'ha' | 'm2';
  transplantDate?: string;
  sigpacReference?: string;
  
  // Documentación
  photos?: string[];
  
  // Gestión de recursos
  fertigation?: IFertigationData;
  phytosanitary?: IPhytosanitaryData;
  water?: IWaterData;
  energy?: IEnergyData;
  
  // Información adicional
  location?: string;
  weather?: string;
  notes?: string;
  status?: 'planning' | 'in-progress' | 'completed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high';
  totalCost: number;
  
  // Metadatos
  createdAt: Date;
  updatedAt: Date;
}

// Schema para fertilizante individual
const FertilizerRecordSchema = new Schema<IFertilizerRecord>({
  fertilizerType: {
    type: String,
    required: true,
    trim: true
  },
  fertilizerAmount: {
    type: Number,
    required: true,
    min: 0
  },
  fertilizerUnit: {
    type: String,
    required: true,
    enum: ['kg', 'g', 'L', 'ml']
  },
  cost: {
    type: Number,
    required: true,
    min: 0
  },
  productId: {
    type: String,
    trim: true
  },
  pricePerUnit: {
    type: Number,
    min: 0
  },
  brand: {
    type: String,
    trim: true
  },
  supplier: {
    type: String,
    trim: true
  },
  purchaseDate: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 200
  }
}, { _id: false });

// Schema para registro diario de fertirriego
const DailyFertigationRecordSchema = new Schema<IDailyFertigationRecord>({
  date: {
    type: String,
    required: true,
    trim: true
  },
  fertilizers: {
    type: [FertilizerRecordSchema],
    default: []
  },
  waterConsumption: {
    type: Number,
    required: true,
    min: 0
  },
  waterUnit: {
    type: String,
    required: true,
    enum: ['L', 'm3', 'gal']
  },
  totalCost: {
    type: Number,
    required: true,
    min: 0
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 200
  }
}, { _id: false });

// Schema para fertirriego
const FertigationDataSchema = new Schema<IFertigationData>({
  enabled: {
    type: Boolean,
    default: false
  },
  dailyRecords: {
    type: [DailyFertigationRecordSchema],
    default: []
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  }
}, { _id: false });

// Schema para tratamientos fitosanitarios
const PhytosanitaryDataSchema = new Schema<IPhytosanitaryData>({
  enabled: {
    type: Boolean,
    default: false
  },
  treatmentType: {
    type: String,
    trim: true
  },
  productName: {
    type: String,
    trim: true
  },
  applicationDate: {
    type: String,
    validate: {
      validator: function(v: string) {
        return !v || /^\d{4}-\d{2}-\d{2}$/.test(v);
      },
      message: 'Application date must be in YYYY-MM-DD format'
    }
  },
  dosage: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  }
}, { _id: false });

// Schema para agua
const WaterDataSchema = new Schema<IWaterData>({
  enabled: {
    type: Boolean,
    default: false
  },
  waterSource: {
    type: String,
    trim: true
  },
  irrigationType: {
    type: String,
    trim: true
  },
  dailyConsumption: {
    type: Number,
    min: 0
  },
  waterUnit: {
    type: String,
    enum: ['L', 'm3', 'gal']
  },
  cost: {
    type: Number,
    min: 0
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  }
}, { _id: false });

// Schema para energía
const EnergyDataSchema = new Schema<IEnergyData>({
  enabled: {
    type: Boolean,
    default: false
  },
  energyType: {
    type: String,
    trim: true
  },
  dailyConsumption: {
    type: Number,
    min: 0
  },
  energyUnit: {
    type: String,
    enum: ['kWh', 'Wh', 'MJ']
  },
  cost: {
    type: Number,
    min: 0
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  }
}, { _id: false });

// Schema principal de Actividad
const ActivitySchema = new Schema<IActivity>({
  userId: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  
  // Información básica
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  cropType: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
    index: true
  },
  plantCount: {
    type: Number,
    min: 0
  },
  area: {
    type: Number,
    required: true,
    min: 0.01
  },
  areaUnit: {
    type: String,
    required: true,
    enum: ['ha', 'm2'],
    default: 'ha'
  },
  transplantDate: {
    type: String,
    validate: {
      validator: function(v: string) {
        return !v || /^\d{4}-\d{2}-\d{2}$/.test(v);
      },
      message: 'Transplant date must be in YYYY-MM-DD format'
    }
  },
  sigpacReference: {
    type: String,
    trim: true,
    maxlength: 50
  },
  
  // Documentación
  photos: [{
    type: String,
    trim: true
  }],
  
  // Gestión de recursos
  fertigation: {
    type: FertigationDataSchema,
    default: () => ({ enabled: false })
  },
  phytosanitary: {
    type: PhytosanitaryDataSchema,
    default: () => ({ enabled: false })
  },
  water: {
    type: WaterDataSchema,
    default: () => ({ enabled: false })
  },
  energy: {
    type: EnergyDataSchema,
    default: () => ({ enabled: false })
  },
  
  // Información adicional
  location: {
    type: String,
    trim: true,
    maxlength: 200
  },
  weather: {
    type: String,
    trim: true,
    maxlength: 100
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['planning', 'in-progress', 'completed', 'cancelled'],
    default: 'planning'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  totalCost: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: true,
  collection: 'activities'
});

// Índices para optimización de consultas
ActivitySchema.index({ userId: 1, createdAt: -1 });
ActivitySchema.index({ userId: 1, cropType: 1 });
ActivitySchema.index({ userId: 1, name: 1 });

// Métodos estáticos
ActivitySchema.statics.findByUser = function(userId: string, options: any = {}) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(options.limit || 0)
    .skip(options.skip || 0);
};

ActivitySchema.statics.getStatsByUser = function(userId: string) {
  return this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalActivities: { $sum: 1 },
        totalCost: { $sum: '$totalCost' },
        totalArea: { $sum: '$area' },
        avgCostPerHectare: { $avg: { $cond: [{ $eq: ['$areaUnit', 'ha'] }, { $divide: ['$totalCost', '$area'] }, { $divide: ['$totalCost', { $divide: ['$area', 10000] }] }] } }
      }
    }
  ]);
};

// Transform para JSON
ActivitySchema.methods.toJSON = function() {
  const obj = this.toObject();
  obj.id = obj._id;
  return obj;
};

const Activity = mongoose.model<IActivity>('Activity', ActivitySchema);

export default Activity;