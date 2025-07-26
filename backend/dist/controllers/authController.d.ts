import { Request, Response } from 'express';
import { AuthResponse, LoginCredentials, RegisterCredentials, AuthRequest } from '../types';
export declare const register: (req: Request<{}, AuthResponse, RegisterCredentials>, res: Response<AuthResponse>) => Promise<void>;
export declare const login: (req: Request<{}, AuthResponse, LoginCredentials>, res: Response<AuthResponse>) => Promise<void>;
export declare const getProfile: (req: AuthRequest, res: Response<AuthResponse>) => Promise<void>;
export declare const validateToken: (req: AuthRequest, res: Response<AuthResponse>) => Promise<void>;
//# sourceMappingURL=authController.d.ts.map