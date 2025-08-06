"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const FertilizerRecordSchema = new mongoose_1.Schema({
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
const DailyFertigationRecordSchema = new mongoose_1.Schema({
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
const FertigationDataSchema = new mongoose_1.Schema({
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
const PhytosanitaryDataSchema = new mongoose_1.Schema({
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
            validator: function (v) {
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
const WaterDataSchema = new mongoose_1.Schema({
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
const EnergyDataSchema = new mongoose_1.Schema({
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
const ActivitySchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
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
            validator: function (v) {
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
    photos: [{
            type: String,
            trim: true
        }],
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
ActivitySchema.index({ userId: 1, createdAt: -1 });
ActivitySchema.index({ userId: 1, cropType: 1 });
ActivitySchema.index({ userId: 1, name: 1 });
ActivitySchema.statics.findByUser = function (userId, options = {}) {
    return this.find({ userId })
        .sort({ createdAt: -1 })
        .limit(options.limit || 0)
        .skip(options.skip || 0);
};
ActivitySchema.statics.getStatsByUser = function (userId) {
    return this.aggregate([
        { $match: { userId: new mongoose_1.default.Types.ObjectId(userId) } },
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
ActivitySchema.methods.toJSON = function () {
    const obj = this.toObject();
    obj.id = obj._id;
    return obj;
};
const Activity = mongoose_1.default.model('Activity', ActivitySchema);
exports.default = Activity;
//# sourceMappingURL=Activity.js.map