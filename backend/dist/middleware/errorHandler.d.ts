import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';
interface CustomError extends Error {
    statusCode?: number;
    isOperational?: boolean;
}
export declare const errorHandler: (error: CustomError, req: Request, res: Response<ApiResponse>, _next: NextFunction) => void;
export declare const notFoundHandler: (req: Request, _res: Response<ApiResponse>, next: NextFunction) => void;
export declare const asyncHandler: (fn: Function) => (req: Request, res: Response, next: NextFunction) => void;
export {};
//# sourceMappingURL=errorHandler.d.ts.map