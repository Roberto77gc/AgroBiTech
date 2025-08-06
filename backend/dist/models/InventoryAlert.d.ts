import mongoose, { Document } from 'mongoose';
export interface IInventoryAlert extends Document {
    userId: string;
    itemId: string;
    productName: string;
    type: 'low_stock' | 'critical_stock' | 'expiry_warning';
    message: string;
    severity: 'warning' | 'critical';
    read: boolean;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IInventoryAlert, {}, {}, {}, mongoose.Document<unknown, {}, IInventoryAlert, {}> & IInventoryAlert & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=InventoryAlert.d.ts.map