"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActivitiesSummary = exports.getDashboardStats = void 0;
const Activity_1 = __importDefault(require("../models/Activity"));
const getDashboardStats = async (req, res) => {
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
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
        const [totalActivities, activitiesData, activitiesThisMonth, recentActivities] = await Promise.all([
            Activity_1.default.countDocuments({ userId }),
            Activity_1.default.find({ userId }).select('totalCost surfaceArea cropType createdAt date'),
            Activity_1.default.countDocuments({
                userId,
                createdAt: { $gte: startOfMonth }
            }),
            Activity_1.default.find({ userId })
                .sort({ createdAt: -1 })
                .limit(5)
                .select('name cropType variety date totalCost plantsCount')
        ]);
        const totalCost = activitiesData.reduce((sum, activity) => sum + activity.totalCost, 0);
        const totalSurfaceArea = activitiesData.reduce((sum, activity) => sum + activity.surfaceArea, 0);
        const averageCostPerHectare = totalSurfaceArea > 0 ? totalCost / totalSurfaceArea : 0;
        const cropStats = activitiesData.reduce((acc, activity) => {
            const crop = activity.cropType;
            if (!acc[crop]) {
                acc[crop] = { crop, count: 0, totalCost: 0 };
            }
            acc[crop].count += 1;
            acc[crop].totalCost += activity.totalCost;
            return acc;
        }, {});
        const topCropTypes = Object.values(cropStats)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
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
        const dashboardStats = {
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
    }
    catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor al obtener estadísticas',
            error: 'Internal server error'
        });
    }
};
exports.getDashboardStats = getDashboardStats;
const getActivitiesSummary = async (req, res) => {
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
        const filter = { userId };
        if (cropType && typeof cropType === 'string') {
            filter.cropType = { $regex: cropType, $options: 'i' };
        }
        const sort = {};
        sort[sortBy] = order === 'desc' ? -1 : 1;
        const activities = await Activity_1.default.find(filter)
            .sort(sort)
            .limit(Number(limit) * 1)
            .skip((Number(page) - 1) * Number(limit))
            .select('name cropType variety date totalCost plantsCount surfaceArea location createdAt');
        const total = await Activity_1.default.countDocuments(filter);
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
    }
    catch (error) {
        console.error('Activities summary error:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor al obtener actividades',
            error: 'Internal server error'
        });
    }
};
exports.getActivitiesSummary = getActivitiesSummary;
//# sourceMappingURL=dashboardController.js.map