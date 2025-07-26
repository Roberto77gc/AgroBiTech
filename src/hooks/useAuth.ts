import { useState, useEffect, useCallback } from 'react';
import { authAPI, tokenManager, AuthResponse } from '../services/api';
import { STORAGE_KEYS } from '../config/api';
import { toast } from 'react-toastify';

export interface User {
  _id: string;
  email: string;
  name: string;
  createdAt: Date;
}

export interface UseAuthReturn {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = tokenManager.get();
        const storedUser = localStorage.getItem(STORAGE_KEYS.USER);

        if (storedToken && tokenManager.isValid()) {
          setToken(storedToken);
          
          if (storedUser) {
            try {
              setUser(JSON.parse(storedUser));
            } catch (error) {
              console.error('Error parsing stored user:', error);
            }
          }

          // Validate token with backend
          try {
            const response = await authAPI.validateToken();
            if (response.success && response.user) {
              setUser(response.user);
              localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.user));
            } else {
              // Token is invalid, clear auth data
              logout();
            }
          } catch (error) {
            console.error('Token validation failed:', error);
            logout();
          }
        } else {
          // No valid token found, clear any stale data
          tokenManager.remove();
          setUser(null);
          setToken(null);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await authAPI.login({ email, password });

      if (response.success && response.token && response.user) {
        setToken(response.token);
        setUser(response.user);
        toast.success(response.message || '¡Bienvenido a AgroDigital!');
        return true;
      } else {
        toast.error(response.message || 'Error en el inicio de sesión');
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Error de conexión. Por favor, inténtalo de nuevo.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await authAPI.register({ email, password, name });

      if (response.success && response.token && response.user) {
        setToken(response.token);
        setUser(response.user);
        toast.success(response.message || '¡Cuenta creada exitosamente!');
        return true;
      } else {
        toast.error(response.message || 'Error en el registro');
        return false;
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Error de conexión. Por favor, inténtalo de nuevo.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback((): void => {
    setUser(null);
    setToken(null);
    tokenManager.remove();
    toast.info('Sesión cerrada correctamente');
  }, []);

  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      if (!token || !tokenManager.isValid()) {
        logout();
        return;
      }

      const response = await authAPI.getProfile();
      if (response.success && response.user) {
        setUser(response.user);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.user));
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      logout();
    }
  }, [token, logout]);

  const isAuthenticated = Boolean(user && token && tokenManager.isValid());

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  };
};