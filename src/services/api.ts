import { API_CONFIG, API_ENDPOINTS, HTTP_STATUS, STORAGE_KEYS } from '../config/api';

// Types for API responses
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface AuthResponse extends ApiResponse {
  token?: string;
  user?: {
    _id: string;
    email: string;
    name: string;
    createdAt: Date;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
}

// Token management
export const tokenManager = {
  get: (): string | null => localStorage.getItem(STORAGE_KEYS.TOKEN),
  set: (token: string): void => localStorage.setItem(STORAGE_KEYS.TOKEN, token),
  remove: (): void => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  },
  isValid: (): boolean => {
    const token = tokenManager.get();
    if (!token) return false;
    
    try {
      // Basic JWT structure validation
      const parts = token.split('.');
      if (parts.length !== 3) return false;
      
      // Decode payload to check expiration
      const payload = JSON.parse(atob(parts[1]));
      const now = Date.now() / 1000;
      
      return payload.exp > now;
    } catch {
      return false;
    }
  }
};

// HTTP client with automatic token handling
class ApiClient {
  private baseURL: string;
  private timeout: number;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const token = tokenManager.get();

    const config: RequestInit = {
      ...options,
      headers: {
        ...API_CONFIG.HEADERS,
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    // Add timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    config.signal = controller.signal;

    try {
      const response = await fetch(url, config);
      clearTimeout(timeoutId);

      const data = await response.json();

      // Handle authentication errors
      if (response.status === HTTP_STATUS.UNAUTHORIZED) {
        tokenManager.remove();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout');
        }
        throw error;
      }
      
      throw new Error('Network error occurred');
    }
  }

  // HTTP Methods
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

// Create API client instance
export const apiClient = new ApiClient();

// Authentication API
export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>(
      API_ENDPOINTS.AUTH.LOGIN,
      credentials
    );
    
    if (response.success && response.token) {
      tokenManager.set(response.token);
      if (response.user) {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.user));
      }
    }
    
    return response;
  },

  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>(
      API_ENDPOINTS.AUTH.REGISTER,
      credentials
    );
    
    if (response.success && response.token) {
      tokenManager.set(response.token);
      if (response.user) {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.user));
      }
    }
    
    return response;
  },

  logout: (): void => {
    tokenManager.remove();
    window.location.href = '/login';
  },

  getProfile: async (): Promise<AuthResponse> => {
    return apiClient.get<AuthResponse>(API_ENDPOINTS.AUTH.PROFILE);
  },

  validateToken: async (): Promise<AuthResponse> => {
    return apiClient.get<AuthResponse>(API_ENDPOINTS.AUTH.VALIDATE);
  },
};

// Dashboard API
export const dashboardAPI = {
  getStats: async (): Promise<ApiResponse> => {
    return apiClient.get(API_ENDPOINTS.DASHBOARD.STATS);
  },

  getActivities: async (params?: {
    page?: number;
    limit?: number;
    cropType?: string;
    sortBy?: string;
    order?: 'asc' | 'desc';
  }): Promise<ApiResponse> => {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const queryString = searchParams.toString();
    const endpoint = queryString 
      ? `${API_ENDPOINTS.DASHBOARD.ACTIVITIES}?${queryString}`
      : API_ENDPOINTS.DASHBOARD.ACTIVITIES;
    
    return apiClient.get(endpoint);
  },
};

// Health check
export const healthAPI = {
  check: async (): Promise<ApiResponse> => {
    return apiClient.get(API_ENDPOINTS.HEALTH);
  },
};