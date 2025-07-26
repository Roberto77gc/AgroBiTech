"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimitValidation = exports.sanitizeInput = exports.handleValidationErrors = exports.activityValidation = exports.loginValidation = exports.registerValidation = void 0;
const express_validator_1 = require("express-validator");
exports.registerValidation = [
    (0, express_validator_1.body)('email')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),
    (0, express_validator_1.body)('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
    (0, express_validator_1.body)('name')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters')
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
        .withMessage('Name can only contain letters and spaces')
];
exports.loginValidation = [
    (0, express_validator_1.body)('email')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),
    (0, express_validator_1.body)('password')
        .notEmpty()
        .withMessage('Password is required')
];
exports.activityValidation = [
    (0, express_validator_1.body)('name')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Activity name must be between 1 and 100 characters'),
    (0, express_validator_1.body)('cropType')
        .trim()
        .notEmpty()
        .withMessage('Crop type is required'),
    (0, express_validator_1.body)('variety')
        .trim()
        .notEmpty()
        .withMessage('Variety is required'),
    (0, express_validator_1.body)('plantsCount')
        .isInt({ min: 1 })
        .withMessage('Plants count must be a positive integer'),
    (0, express_validator_1.body)('surfaceArea')
        .isFloat({ min: 0.01 })
        .withMessage('Surface area must be greater than 0'),
    (0, express_validator_1.body)('waterUsed')
        .isFloat({ min: 0 })
        .withMessage('Water used cannot be negative'),
    (0, express_validator_1.body)('location.lat')
        .isFloat({ min: -90, max: 90 })
        .withMessage('Invalid latitude'),
    (0, express_validator_1.body)('location.lng')
        .isFloat({ min: -180, max: 180 })
        .withMessage('Invalid longitude'),
    (0, express_validator_1.body)('products')
        .isArray()
        .withMessage('Products must be an array'),
    (0, express_validator_1.body)('products.*.name')
        .trim()
        .notEmpty()
        .withMessage('Product name is required'),
    (0, express_validator_1.body)('products.*.dose')
        .isFloat({ min: 0 })
        .withMessage('Product dose cannot be negative'),
    (0, express_validator_1.body)('products.*.pricePerUnit')
        .isFloat({ min: 0 })
        .withMessage('Product price cannot be negative'),
    (0, express_validator_1.body)('products.*.unit')
        .isIn(['kg', 'l', 'g', 'ml'])
        .withMessage('Invalid unit'),
    (0, express_validator_1.body)('products.*.category')
        .isIn(['fertilizer', 'pesticide', 'seed', 'other'])
        .withMessage('Invalid category')
];
const handleValidationErrors = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
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
exports.handleValidationErrors = handleValidationErrors;
exports.sanitizeInput = [
    (0, express_validator_1.body)('*').trim().escape()
];
const rateLimitValidation = (_req, _res, next) => {
    next();
};
exports.rateLimitValidation = rateLimitValidation;
//# sourceMappingURL=validation.js.map