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
const InventoryMovementSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    inventoryItemId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'InventoryItem', required: true, index: true },
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
}, { timestamps: { createdAt: true, updatedAt: false }, collection: 'inventory_movements' });
InventoryMovementSchema.index({ userId: 1, activityId: 1, module: 1, dayIndex: 1, createdAt: 1 });
const InventoryMovement = mongoose_1.default.model('InventoryMovement', InventoryMovementSchema);
exports.default = InventoryMovement;
//# sourceMappingURL=InventoryMovement.js.map