import { Response } from 'express';
import { AuthRequest, ApiResponse } from '../types';
interface DashboardStats {
    totalActivities: number;
    totalCost: number;
    averageCostPerHectare: number;
    activitiesThisMonth: number;
    topCropTypes: Array<{
        crop: string;
        count: number;
        totalCost: number;
    }>;
    monthlyStats: Array<{
        month: string;
        activities: number;
        cost: number;
    }>;
    recentActivities: any[];
}
export declare const getDashboardStats: (req: AuthRequest, res: Response<ApiResponse<DashboardStats>>) => Promise<void>;
export declare const getActivitiesSummary: (req: AuthRequest, res: Response<ApiResponse>) => Promise<void>;
export {};
//# sourceMappingURL=dashboardController.d.ts.map