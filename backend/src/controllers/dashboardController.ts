import { Response } from 'express';
import Activity from '../models/Activity';
import { AuthRequest, ApiResponse } from '../types';

interface DashboardStats {
  totalActivities: number;
  totalCost: number;
  averageCostPerHectare: number;
  activitiesThisMonth: number;
  topCropTypes: Array<{ crop: string; count: number; totalCost: number }>;
  monthlyStats: Array<{ month: string; activities: number; cost: number }>;
  recentActivities: any[];
}

// @desc    Get dashboard statistics
// @route   GET /api/dashboard
// @access  Private
export const getDashboardStats = async (
  req: AuthRequest,
  res: Response<ApiResponse<DashboardStats>>
): Promise<void> => {
  try {
    const userId = req.user?._id;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
        error: 'User not authenticated'
      });
      return;
    }

    // Get current date info
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const startOfMonth = new Date(currentYear, currentMonth - 1, 1);

    // Parallel queries for better performance
    const [
      totalActivities,
      activitiesData,
      activitiesThisMonth,
      recentActivities
    ] = await Promise.all([
      // Total activities count
      Activity.countDocuments({ userId }),
      
      // All activities for calculations
      Activity.find({ userId }).select('totalCost surfaceArea cropType createdAt date'),
      
      // Activities this month
      Activity.countDocuments({ 
        userId,
        createdAt: { $gte: startOfMonth }
      }),
      
      // Recent activities (last 5)
      Activity.find({ userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name cropType variety date totalCost plantsCount')
    ]);

    // Calculate total cost and average cost per hectare
    const totalCost = activitiesData.reduce((sum, activity) => sum + activity.totalCost, 0);
    const totalSurfaceArea = activitiesData.reduce((sum, activity) => sum + activity.surfaceArea, 0);
    const averageCostPerHectare = totalSurfaceArea > 0 ? totalCost / totalSurfaceArea : 0;

    // Calculate top crop types
    const cropStats = activitiesData.reduce((acc, activity) => {
      const crop = activity.cropType;
      if (!acc[crop]) {
        acc[crop] = { crop, count: 0, totalCost: 0 };
      }
      acc[crop].count += 1;
      acc[crop].totalCost += activity.totalCost;
      return acc;
    }, {} as Record<string, { crop: string; count: number; totalCost: number }>);

    const topCropTypes = Object.values(cropStats)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate monthly stats for the last 12 months
    const monthlyStats = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - 1 - i, 1);
      const nextMonth = new Date(currentYear, currentMonth - i, 1);
      
      const monthActivities = activitiesData.filter(activity => {
        const activityDate = new Date(activity.createdAt);
        return activityDate >= date && activityDate < nextMonth;
      });

      const monthCost = monthActivities.reduce((sum, activity) => sum + activity.totalCost, 0);
      
      monthlyStats.push({
        month: date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
        activities: monthActivities.length,
        cost: monthCost
      });
    }

    // Prepare dashboard stats
    const dashboardStats: DashboardStats = {
      totalActivities,
      totalCost: Math.round(totalCost * 100) / 100,
      averageCostPerHectare: Math.round(averageCostPerHectare * 100) / 100,
      activitiesThisMonth,
      topCropTypes,
      monthlyStats,
      recentActivities
    };

    res.status(200).json({
      success: true,
      message: 'Estadísticas del dashboard obtenidas exitosamente',
      data: dashboardStats
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al obtener estadísticas',
      error: 'Internal server error'
    });
  }
};

// @desc    Get user activities summary
// @route   GET /api/dashboard/activities
// @access  Private
export const getActivitiesSummary = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const userId = req.user?._id;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
        error: 'User not authenticated'
      });
      return;
    }

    const { page = 1, limit = 10, cropType, sortBy = 'createdAt', order = 'desc' } = req.query;
    
    // Build filter
    const filter: any = { userId };
    if (cropType && typeof cropType === 'string') {
      filter.cropType = { $regex: cropType, $options: 'i' };
    }

    // Build sort
    const sort: any = {};
    sort[sortBy as string] = order === 'desc' ? -1 : 1;

    // Execute query with pagination
    const activities = await Activity.find(filter)
      .sort(sort)
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit))
      .select('name cropType variety date totalCost plantsCount surfaceArea location createdAt');

    const total = await Activity.countDocuments(filter);

    res.status(200).json({
      success: true,
      message: 'Resumen de actividades obtenido exitosamente',
      data: activities,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });

  } catch (error) {
    console.error('Activities summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al obtener actividades',
      error: 'Internal server error'
    });
  }
};