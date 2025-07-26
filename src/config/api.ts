// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  TIMEOUT: 10000, // 10 seconds
  HEADERS: {
    'Content-Type': 'application/json',
  },
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    PROFILE: '/auth/profile',
    VALIDATE: '/auth/validate',
  },
  // Dashboard
  DASHBOARD: {
    STATS: '/dashboard',
    ACTIVITIES: '/dashboard/activities',
  },
  // Health check
  HEALTH: '/health',
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'agrodigital_token',
  USER: 'agrodigital_user',
} as const;