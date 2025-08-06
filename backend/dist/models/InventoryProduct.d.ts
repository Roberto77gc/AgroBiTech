import mongoose from 'mongoose';
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
declare const InventoryProduct: mongoose.Model<IInventoryProduct, {}, {}, {}, mongoose.Document<unknown, {}, IInventoryProduct, {}> & IInventoryProduct & Required<{
    _id: string;
}> & {
    __v: number;
}, any>;
export default InventoryProduct;
//# sourceMappingURL=InventoryProduct.d.ts.map