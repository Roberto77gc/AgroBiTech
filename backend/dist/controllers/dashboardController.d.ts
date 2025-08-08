import { Request, Response } from 'express';
interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        email: string;
        name: string;
    };
}
export declare const getDashboardStats: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getAdvancedDashboard: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getActivities: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const createActivity: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const updateActivity: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const deleteActivity: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getActivityById: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const addFertigationDay: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateFertigationDay: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteFertigationDay: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const addPhytosanitaryDay: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updatePhytosanitaryDay: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deletePhytosanitaryDay: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const addWaterDay: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateWaterDay: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteWaterDay: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export {};
//# sourceMappingURL=dashboardController.d.ts.map