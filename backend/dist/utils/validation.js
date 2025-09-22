"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeString = exports.validateRequiredFields = exports.validatePhone = exports.validatePassword = exports.validateEmail = void 0;
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
exports.validateEmail = validateEmail;
const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
};
exports.validatePassword = validatePassword;
const validatePhone = (phone) => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
};
exports.validatePhone = validatePhone;
const validateRequiredFields = (data, requiredFields) => {
    return requiredFields.every(field => data[field] !== undefined && data[field] !== null && data[field] !== '');
};
exports.validateRequiredFields = validateRequiredFields;
const sanitizeString = (input) => {
    return input
        .replace(/[<>]/g, '')
        .trim()
        .substring(0, 1000);
};
exports.sanitizeString = sanitizeString;
//# sourceMappingURL=validation.js.map