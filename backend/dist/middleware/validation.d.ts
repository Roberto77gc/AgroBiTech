import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';
export declare const registerValidation: import("express-validator").ValidationChain[];
export declare const loginValidation: import("express-validator").ValidationChain[];
export declare const activityValidation: import("express-validator").ValidationChain[];
export declare const handleValidationErrors: (req: Request, res: Response<ApiResponse>, next: NextFunction) => void;
export declare const sanitizeInput: import("express-validator").ValidationChain[];
export declare const rateLimitValidation: (_req: Request, _res: Response<ApiResponse>, next: NextFunction) => void;
//# sourceMappingURL=validation.d.ts.map