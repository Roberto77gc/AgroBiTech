/**
 * Validation utilities for AgroBiTech Backend
 * Provides common validation functions for email, data, etc.
 */

/**
 * Validates email format using regex
 * @param email - Email string to validate
 * @returns boolean - true if valid email format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates password strength
 * @param password - Password string to validate
 * @returns boolean - true if password meets requirements
 */
export const validatePassword = (password: string): boolean => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

/**
 * Validates phone number format
 * @param phone - Phone string to validate
 * @returns boolean - true if valid phone format
 */
export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

/**
 * Validates required fields in an object
 * @param data - Object to validate
 * @param requiredFields - Array of required field names
 * @returns boolean - true if all required fields are present
 */
export const validateRequiredFields = (data: any, requiredFields: string[]): boolean => {
  return requiredFields.every(field => data[field] !== undefined && data[field] !== null && data[field] !== '');
};

/**
 * Sanitizes string input to prevent XSS
 * @param input - String to sanitize
 * @returns string - Sanitized string
 */
export const sanitizeString = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .trim()
    .substring(0, 1000); // Limit length
};
