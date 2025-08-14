import mongoose, { Document } from 'mongoose';
export interface IInventoryMovement extends Document {
    userId: mongoose.Types.ObjectId | string;
    inventoryItemId: mongoose.Types.ObjectId | string;
    productId: string;
    productName?: string;
    operation: 'add' | 'subtract';
    amount: number;
    unit: string;
    amountInItemUnit: number;
    balanceAfter: number;
    reason?: string;
    activityId?: string;
    module?: 'fertigation' | 'phytosanitary' | 'water';
    dayIndex?: number;
    createdAt: Date;
}
declare const InventoryMovement: mongoose.Model<IInventoryMovement, {}, {}, {}, mongoose.Document<unknown, {}, IInventoryMovement, {}> & IInventoryMovement & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default InventoryMovement;
//# sourceMappingURL=InventoryMovement.d.ts.map