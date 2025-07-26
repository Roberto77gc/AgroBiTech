import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';

interface CustomError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

// Global error handler middleware
export const errorHandler = (
  error: CustomError,
  req: Request,
  res: Response<ApiResponse>,
  _next: NextFunction
): void => {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal Server Error';
  let errorDetails = 'An unexpected error occurred';

  // Mongoose validation error
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    errorDetails = 'Invalid input data';
  }

  // Mongoose duplicate key error
  if (error.name === 'MongoError' && (error as any).code === 11000) {
    statusCode = 400;
    message = 'Duplicate field value';
    errorDetails = 'Resource already exists';
  }

  // Mongoose cast error (invalid ObjectId)
  if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
    errorDetails = 'Invalid resource ID';
  }

  // JWT errors
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

  // Log error for debugging (only in development)
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

  // Send error response
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

// 404 Not Found handler
export const notFoundHandler = (
  req: Request,
  _res: Response<ApiResponse>,
  next: NextFunction
): void => {
  const error = new Error(`Route ${req.originalUrl} not found`) as CustomError;
  error.statusCode = 404;
  next(error);
};

// Async error catcher wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};