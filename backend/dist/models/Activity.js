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
const ProductUsedSchema = new mongoose_1.Schema({
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
const SubActivityRecordSchema = new mongoose_1.Schema({
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
const ActivityRecordSchema = new mongoose_1.Schema({
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
ActivityRecordSchema.index({ userId: 1, date: -1 });
ActivityRecordSchema.index({ userId: 1, cropType: 1 });
ActivityRecordSchema.index({ createdAt: -1 });
ActivityRecordSchema.pre('save', function (next) {
    if (this.products && this.products.length > 0) {
        const productsCost = this.products.reduce((total, product) => {
            return total + (product.dose * product.pricePerUnit);
        }, 0);
        const fertiriegoCost = this.fertirriego.reduce((total, fertirriego) => {
            return total + fertirriego.coste;
        }, 0);
        this.totalCost = productsCost + fertiriegoCost;
        this.costPerHectare = this.surfaceArea > 0 ? this.totalCost / this.surfaceArea : 0;
    }
    next();
});
const Activity = mongoose_1.default.model('Activity', ActivityRecordSchema);
exports.default = Activity;
//# sourceMappingURL=Activity.js.map