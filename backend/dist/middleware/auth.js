"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuthMiddleware = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                message: 'Access denied. No token provided or invalid format.',
                error: 'Authentication required'
            });
            return;
        }
        const token = authHeader.substring(7);
        if (!token) {
            res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.',
                error: 'Authentication required'
            });
            return;
        }
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error('JWT_SECRET is not defined in environment variables');
        }
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        const user = await User_1.default.findById(decoded.userId);
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Access denied. User not found.',
                error: 'Invalid token'
            });
            return;
        }
        req.user = user;
        next();
    }
    catch (error) {
        console.error('Auth middleware error:', error);
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            res.status(401).json({
                success: false,
                message: 'Access denied. Invalid token.',
                error: 'Token verification failed'
            });
            return;
        }
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            res.status(401).json({
                success: false,
                message: 'Access denied. Token expired.',
                error: 'Token has expired'
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: 'Internal server error during authentication.',
            error: 'Authentication failed'
        });
    }
};
exports.authMiddleware = authMiddleware;
const optionalAuthMiddleware = async (req, _res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }
        const token = authHeader.substring(7);
        if (!token) {
            return next();
        }
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            return next();
        }
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        const user = await User_1.default.findById(decoded.userId);
        if (user) {
            req.user = user;
        }
        next();
    }
    catch (error) {
        next();
    }
};
exports.optionalAuthMiddleware = optionalAuthMiddleware;
//# sourceMappingURL=auth.js.map