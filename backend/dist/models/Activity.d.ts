import mongoose, { Document } from 'mongoose';
export interface IFertilizerRecord {
    fertilizerType: string;
    fertilizerAmount: number;
    fertilizerUnit: string;
    cost: number;
    productId?: string;
    pricePerUnit?: number;
    brand?: string;
    supplier?: string;
    purchaseDate?: string;
    notes?: string;
}
export interface IDailyFertigationRecord {
    date: string;
    fertilizers: IFertilizerRecord[];
    waterConsumption: number;
    waterUnit: string;
    totalCost: number;
    notes?: string;
}
export interface IFertigationData {
    enabled: boolean;
    dailyRecords: IDailyFertigationRecord[];
    notes?: string;
}
export interface IPhytosanitaryData {
    enabled: boolean;
    treatmentType?: string;
    productName?: string;
    applicationDate?: string;
    dosage?: string;
    notes?: string;
}
export interface IWaterData {
    enabled: boolean;
    waterSource?: string;
    irrigationType?: string;
    dailyConsumption?: number;
    waterUnit?: string;
    cost?: number;
    notes?: string;
}
export interface IEnergyData {
    enabled: boolean;
    energyType?: string;
    dailyConsumption?: number;
    energyUnit?: string;
    cost?: number;
    notes?: string;
}
export interface IActivity extends Document {
    _id: string;
    userId: mongoose.Types.ObjectId;
    name: string;
    cropType: string;
    plantCount?: number;
    area: number;
    areaUnit: 'ha' | 'm2';
    transplantDate?: string;
    sigpacReference?: string;
    photos?: string[];
    fertigation?: IFertigationData;
    phytosanitary?: IPhytosanitaryData;
    water?: IWaterData;
    energy?: IEnergyData;
    location?: string;
    weather?: string;
    notes?: string;
    status?: 'planning' | 'in-progress' | 'completed' | 'cancelled';
    priority?: 'low' | 'medium' | 'high';
    totalCost: number;
    createdAt: Date;
    updatedAt: Date;
}
declare const Activity: mongoose.Model<IActivity, {}, {}, {}, mongoose.Document<unknown, {}, IActivity, {}> & IActivity & Required<{
    _id: string;
}> & {
    __v: number;
}, any>;
export default Activity;
//# sourceMappingURL=Activity.d.ts.map