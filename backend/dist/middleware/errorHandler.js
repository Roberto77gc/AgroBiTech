"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.notFoundHandler = exports.errorHandler = void 0;
const errorHandler = (error, req, res, _next) => {
    let statusCode = error.statusCode || 500;
    let message = error.message || 'Internal Server Error';
    let errorDetails = 'An unexpected error occurred';
    if (error.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation Error';
        errorDetails = 'Invalid input data';
    }
    if (error.name === 'MongoError' && error.code === 11000) {
        statusCode = 400;
        message = 'Duplicate field value';
        errorDetails = 'Resource already exists';
    }
    if (error.name === 'CastError') {
        statusCode = 400;
        message = 'Invalid ID format';
        errorDetails = 'Invalid resource ID';
    }
    if (error.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
        errorDetails = 'Authentication failed';
    }
    if (error.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
        errorDetails = 'Please login again';
    }
    if (process.env.NODE_ENV === 'development') {
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            statusCode,
            url: req.url,
            method: req.method,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });
    }
    res.status(statusCode).json({
        success: false,
        message,
        error: errorDetails,
        ...(process.env.NODE_ENV === 'development' && {
            stack: error.stack,
            timestamp: new Date().toISOString()
        })
    });
};
exports.errorHandler = errorHandler;
const notFoundHandler = (req, _res, next) => {
    const error = new Error(`Route ${req.originalUrl} not found`);
    error.statusCode = 404;
    next(error);
};
exports.notFoundHandler = notFoundHandler;
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
//# sourceMappingURL=errorHandler.js.map