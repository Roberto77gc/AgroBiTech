import { useState, useEffect, useCallback } from 'react';
import { dashboardAPI, ApiResponse } from '../services/api';
import { toast } from 'react-toastify';

export interface DashboardStats {
  totalActivities: number;
  totalCost: number;
  averageCostPerHectare: number;
  activitiesThisMonth: number;
  topCropTypes: Array<{ crop: string; count: number; totalCost: number }>;
  monthlyStats: Array<{ month: string; activities: number; cost: number }>;
  recentActivities: any[];
}

export interface UseDashboardReturn {
  stats: DashboardStats | null;
  activities: any[];
  isLoading: boolean;
  error: string | null;
  refreshStats: () => Promise<void>;
  refreshActivities: (params?: DashboardActivityParams) => Promise<void>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  } | null;
}

export interface DashboardActivityParams {
  page?: number;
  limit?: number;
  cropType?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export const useDashboard = (): UseDashboardReturn => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    pages: number;
  } | null>(null);

  const refreshStats = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await dashboardAPI.getStats();
      
      if (response.success && response.data) {
        setStats(response.data);
      } else {
        const errorMessage = response.message || 'Error al cargar estadísticas';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      const errorMessage = 'Error de conexión al cargar estadísticas';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshActivities = useCallback(async (params?: DashboardActivityParams): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await dashboardAPI.getActivities(params);
      
      if (response.success) {
        setActivities(response.data || []);
        setPagination(response.pagination || null);
      } else {
        const errorMessage = response.message || 'Error al cargar actividades';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      const errorMessage = 'Error de conexión al cargar actividades';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        
        // Load stats and recent activities in parallel
        await Promise.all([
          refreshStats(),
          refreshActivities({ page: 1, limit: 5 })
        ]);
      } catch (error) {
        console.error('Error loading initial dashboard data:', error);
      }
    };

    loadInitialData();
  }, [refreshStats, refreshActivities]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isLoading) {
        refreshStats();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [refreshStats, isLoading]);

  return {
    stats,
    activities,
    isLoading,
    error,
    refreshStats,
    refreshActivities,
    pagination,
  };
};