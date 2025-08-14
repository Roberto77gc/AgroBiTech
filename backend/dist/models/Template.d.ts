import mongoose, { Document } from 'mongoose';
export interface ITemplate extends Document {
    userId: string;
    name: string;
    type: 'fertigation' | 'phytosanitary';
    payload: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<ITemplate, {}, {}, {}, mongoose.Document<unknown, {}, ITemplate, {}> & ITemplate & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Template.d.ts.map