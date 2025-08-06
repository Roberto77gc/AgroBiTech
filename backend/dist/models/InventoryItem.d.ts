import mongoose, { Document } from 'mongoose';
export interface IInventoryItem extends Document {
    userId: string;
    productId: string;
    productName: string;
    productType: 'fertilizer' | 'water' | 'phytosanitary';
    currentStock: number;
    minStock: number;
    criticalStock: number;
    unit: string;
    location: string;
    expiryDate?: string;
    lastUpdated: Date;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IInventoryItem, {}, {}, {}, mongoose.Document<unknown, {}, IInventoryItem, {}> & IInventoryItem & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=InventoryItem.d.ts.map