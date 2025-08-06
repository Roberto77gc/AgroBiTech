import mongoose, { Document } from 'mongoose';
export interface IProductPurchase extends Document {
    userId: string;
    productId: string;
    productName: string;
    brand: string;
    supplier: string;
    purchaseDate: string;
    pricePerUnit: number;
    quantity: number;
    totalCost: number;
    unit: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IProductPurchase, {}, {}, {}, mongoose.Document<unknown, {}, IProductPurchase, {}> & IProductPurchase & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=ProductPurchase.d.ts.map