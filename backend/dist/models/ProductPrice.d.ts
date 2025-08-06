import mongoose, { Document } from 'mongoose';
export interface IProductPrice extends Document {
    userId: string;
    name: string;
    type: 'fertilizer' | 'water' | 'phytosanitary';
    pricePerUnit: number;
    unit: string;
    category?: string;
    description?: string;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IProductPrice, {}, {}, {}, mongoose.Document<unknown, {}, IProductPrice, {}> & IProductPrice & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=ProductPrice.d.ts.map