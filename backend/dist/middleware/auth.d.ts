import { Response, NextFunction } from 'express';
import { AuthRequest, ApiResponse } from '../types';
export declare const authMiddleware: (req: AuthRequest, res: Response<ApiResponse>, next: NextFunction) => Promise<void>;
export declare const optionalAuthMiddleware: (req: AuthRequest, _res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auth.d.ts.map