import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';

// Validation rules for registration
export const registerValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('Name can only contain letters and spaces')
];

// Validation rules for login
export const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Validation rules for activity creation
export const activityValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Activity name must be between 1 and 100 characters'),
  
  body('cropType')
    .trim()
    .notEmpty()
    .withMessage('Crop type is required'),
  
  body('variety')
    .trim()
    .notEmpty()
    .withMessage('Variety is required'),
  
  body('plantsCount')
    .isInt({ min: 1 })
    .withMessage('Plants count must be a positive integer'),
  
  body('surfaceArea')
    .isFloat({ min: 0.01 })
    .withMessage('Surface area must be greater than 0'),
  
  body('waterUsed')
    .isFloat({ min: 0 })
    .withMessage('Water used cannot be negative'),
  
  body('location.lat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Invalid latitude'),
  
  body('location.lng')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Invalid longitude'),
  
  body('products')
    .isArray()
    .withMessage('Products must be an array'),
  
  body('products.*.name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required'),
  
  body('products.*.dose')
    .isFloat({ min: 0 })
    .withMessage('Product dose cannot be negative'),
  
  body('products.*.pricePerUnit')
    .isFloat({ min: 0 })
    .withMessage('Product price cannot be negative'),
  
  body('products.*.unit')
    .isIn(['kg', 'l', 'g', 'ml'])
    .withMessage('Invalid unit'),
  
  body('products.*.category')
    .isIn(['fertilizer', 'pesticide', 'seed', 'other'])
    .withMessage('Invalid category')
];

// Generic validation result handler
export const handleValidationErrors = (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const validationErrors = errors.array().map(error => ({
      field: error.type === 'field' ? error.path : 'unknown',
      message: error.msg
    }));

    res.status(400).json({
      success: false,
      message: 'Validation failed',
      error: 'Invalid input data',
      data: validationErrors
    });
    return;
  }
  
  next();
};

// Sanitization middleware
export const sanitizeInput = [
  body('*').trim().escape()
];

// Rate limiting validation
export const rateLimitValidation = (
  _req: Request,
  _res: Response<ApiResponse>,
  next: NextFunction
): void => {
  // This would normally be handled by express-rate-limit middleware
  // But we can add custom validation here if needed
  next();
};