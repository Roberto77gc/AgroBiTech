import { Request, Response } from 'express';
import { AuthResponse, LoginCredentials, RegisterCredentials, AuthRequest, ApiResponse } from '../types';
export declare const demoLogin: (req: Request<{}, AuthResponse, LoginCredentials>, res: Response<AuthResponse>) => Promise<void>;
export declare const demoRegister: (req: Request<{}, AuthResponse, RegisterCredentials>, res: Response<AuthResponse>) => Promise<void>;
export declare const demoGetProfile: (_req: AuthRequest, res: Response<AuthResponse>) => Promise<void>;
export declare const demoValidateToken: (_req: AuthRequest, res: Response<AuthResponse>) => Promise<void>;
export declare const demoDashboardStats: (_req: AuthRequest, res: Response<ApiResponse>) => Promise<void>;
export declare const demoActivities: (req: AuthRequest, res: Response<ApiResponse>) => Promise<void>;
//# sourceMappingURL=demoController.d.ts.map