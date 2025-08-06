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
export {};
//# sourceMappingURL=dashboardController.d.ts.map