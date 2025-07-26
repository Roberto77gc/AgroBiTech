import mongoose from 'mongoose';
import { IActivityRecord } from '../types';
declare const Activity: mongoose.Model<IActivityRecord, {}, {}, {}, mongoose.Document<unknown, {}, IActivityRecord, {}> & IActivityRecord & Required<{
    _id: string;
}> & {
    __v: number;
}, any>;
export default Activity;
//# sourceMappingURL=Activity.d.ts.map