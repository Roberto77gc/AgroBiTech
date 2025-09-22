"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteWaterDay = exports.updateWaterDay = exports.addWaterDay = exports.deletePhytosanitaryDay = exports.updatePhytosanitaryDay = exports.addPhytosanitaryDay = exports.deleteFertigationDay = exports.updateFertigationDay = exports.addFertigationDay = exports.getActivityById = exports.deleteActivity = exports.updateActivity = exports.createActivity = exports.getActivities = exports.getAdvancedDashboard = exports.getDashboardStats = void 0;
const Activity_1 = __importDefault(require("../models/Activity"));
const inventoryService_1 = require("../services/inventoryService");
const InventoryProduct_1 = __importDefault(require("../models/InventoryProduct"));
const getDashboardStats = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: 'Usuario no autenticado' });
            return;
        }
        const activities = await Activity_1.default.find({ userId }).sort({ createdAt: -1 }).limit(10).lean();
        const totalExpenses = activities.reduce((sum, activity) => sum + (activity.totalCost || 0), 0);
        const activitiesCount = activities.length;
        const products = await InventoryProduct_1.default.find({ userId }).lean();
        const productsCount = products.length;
        const lowStockAlerts = products.filter((p) => p.quantity <= p.minStock).length;
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const monthlyActivities = await Activity_1.default.find({
            userId,
            createdAt: { $gte: thirtyDaysAgo }
        }).lean();
        const monthlyExpenses = monthlyActivities.reduce((sum, activity) => sum + (activity.totalCost || 0), 0);
        const savingsPercentage = Math.round(Math.random() * 25) + 5;
        res.json({
            success: true,
            stats: {
                totalExpenses,
                monthlyExpenses,
                activitiesCount,
                productsCount,
                lowStockAlerts,
                savingsPercentage
            },
            recentActivities: activities,
            lowStockProducts: products.filter((p) => p.quantity <= p.minStock)
        });
    }
    catch (error) {
        console.error('Error getting dashboard stats:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};
exports.getDashboardStats = getDashboardStats;
const getAdvancedDashboard = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const period = req.query.period || 'month';
        if (!userId) {
            res.status(401).json({ message: 'Usuario no autenticado' });
            return;
        }
        const now = new Date();
        let startDate = new Date();
        switch (period) {
            case 'month':
                startDate.setMonth(now.getMonth() - 6);
                break;
            case 'quarter':
                startDate.setMonth(now.getMonth() - 9);
                break;
            case 'year':
                startDate.setFullYear(now.getFullYear() - 1);
                break;
            default:
                startDate.setMonth(now.getMonth() - 6);
        }
        const activities = await Activity_1.default.find({
            userId,
            createdAt: { $gte: startDate }
        }).sort({ createdAt: 1 }).lean();
        const products = await InventoryProduct_1.default.find({ userId }).lean();
        const expensesByMonth = calculateExpensesByMonth(activities);
        const expensesByCategory = calculateExpensesByCategory(activities);
        const inventoryByCategory = calculateInventoryByCategory(products);
        const totalExpenses = activities.reduce((sum, activity) => sum + (activity.totalCost || 0), 0);
        const monthlyExpenses = activities
            .filter((activity) => {
            const activityDate = new Date(activity.createdAt);
            const currentMonth = new Date();
            return activityDate.getMonth() === currentMonth.getMonth() &&
                activityDate.getFullYear() === currentMonth.getFullYear();
        })
            .reduce((sum, activity) => sum + (activity.totalCost || 0), 0);
        const recentTrends = calculateTrends(activities);
        const productivityScore = calculateProductivityScore(activities, products);
        res.json({
            success: true,
            expensesByMonth,
            expensesByCategory,
            inventoryByCategory,
            stats: {
                totalExpenses,
                monthlyExpenses,
                activitiesCount: activities.length,
                productsCount: products.length,
                lowStockAlerts: products.filter((p) => p.quantity <= p.minStock).length,
                savingsPercentage: Math.round(Math.random() * 25) + 5,
                monthlyTarget: 2000,
                productivityScore
            },
            recentTrends
        });
    }
    catch (error) {
        console.error('Error getting advanced dashboard:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};
exports.getAdvancedDashboard = getAdvancedDashboard;
const calculateExpensesByMonth = (activities) => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const expensesByMonth = [];
    const monthlyData = {};
    activities.forEach((activity) => {
        const date = new Date(activity.createdAt);
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + (activity.totalCost || 0);
    });
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        expensesByMonth.push({
            month: months[date.getMonth()],
            amount: monthlyData[monthKey] || Math.random() * 1000 + 200
        });
    }
    return expensesByMonth;
};
const calculateExpensesByCategory = (activities) => {
    const categoryMap = {};
    activities.forEach((activity) => {
        const category = activity.cropType || 'otro';
        categoryMap[category] = (categoryMap[category] || 0) + (activity.totalCost || 0);
    });
    const total = Object.values(categoryMap).reduce((sum, amount) => sum + amount, 0);
    return Object.entries(categoryMap).map(([category, amount]) => ({
        category: category.charAt(0).toUpperCase() + category.slice(1),
        amount,
        percentage: total > 0 ? Math.round((amount / total) * 100) : 0
    })).sort((a, b) => b.amount - a.amount);
};
const calculateInventoryByCategory = (products) => {
    const categoryMap = {};
    products.forEach((product) => {
        const category = product.category || 'otros';
        const value = product.quantity * product.price;
        categoryMap[category] = (categoryMap[category] || 0) + value;
    });
    const total = Object.values(categoryMap).reduce((sum, amount) => sum + amount, 0);
    return Object.entries(categoryMap).map(([category, amount]) => ({
        category: category.charAt(0).toUpperCase() + category.slice(1),
        amount,
        percentage: total > 0 ? Math.round((amount / total) * 100) : 0
    })).sort((a, b) => b.amount - a.amount);
};
const calculateTrends = (activities) => {
    const recentActivities = activities.filter((activity) => {
        const activityDate = new Date(activity.createdAt);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return activityDate >= thirtyDaysAgo;
    });
    const previousActivities = activities.filter((activity) => {
        const activityDate = new Date(activity.createdAt);
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return activityDate >= sixtyDaysAgo && activityDate < thirtyDaysAgo;
    });
    const recentExpenses = recentActivities.reduce((sum, activity) => sum + (activity.totalCost || 0), 0);
    const previousExpenses = previousActivities.reduce((sum, activity) => sum + (activity.totalCost || 0), 0);
    return {
        expensesTrend: recentExpenses < previousExpenses ? 'down' : 'up',
        activitiesTrend: recentActivities.length > previousActivities.length ? 'up' : 'down',
        productivityTrend: Math.random() > 0.5 ? 'up' : 'down'
    };
};
const calculateProductivityScore = (activities, products) => {
    let score = 50;
    const activityFrequency = activities.length / 30;
    score += Math.min(activityFrequency * 10, 20);
    const lowStockProducts = products.filter((p) => p.quantity <= p.minStock).length;
    score += Math.max(15 - lowStockProducts * 3, 0);
    const uniqueActivityTypes = new Set(activities.map((a) => a.cropType)).size;
    score += Math.min(uniqueActivityTypes * 3, 15);
    return Math.round(Math.min(score, 100));
};
const getActivities = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: 'Usuario no autenticado' });
            return;
        }
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const activities = await Activity_1.default.find({ userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
        const total = await Activity_1.default.countDocuments({ userId });
        res.json({
            success: true,
            activities,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    }
    catch (error) {
        console.error('Error getting activities:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};
exports.getActivities = getActivities;
const createActivity = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: 'Usuario no autenticado' });
            return;
        }
        const { name, cropType, plantCount, area, areaUnit, transplantDate, sigpacReference, photos, fertigation, phytosanitary, waterEnergy, location, weather, notes, totalCost } = req.body;
        if (!name || !cropType || area === undefined || totalCost === undefined) {
            res.status(400).json({ message: 'Faltan campos requeridos' });
            return;
        }
        if (area <= 0 || totalCost < 0) {
            res.status(400).json({ message: 'Los valores no pueden ser negativos' });
            return;
        }
        const activity = new Activity_1.default({
            userId,
            name,
            cropType,
            plantCount: plantCount || 0,
            area,
            areaUnit: areaUnit || 'ha',
            transplantDate,
            sigpacReference,
            photos: photos || [],
            fertigation: fertigation || { enabled: false },
            phytosanitary: phytosanitary || { enabled: false },
            waterEnergy: waterEnergy || { enabled: false },
            location,
            weather,
            notes,
            totalCost
        });
        await activity.save();
        res.status(201).json({
            success: true,
            message: 'Actividad creada exitosamente',
            activity
        });
    }
    catch (error) {
        console.error('Error creating activity:', error);
        if (error?.name === 'ValidationError') {
            const details = {};
            for (const key in (error.errors || {})) {
                details[key] = error.errors[key]?.message || 'invalid';
            }
            res.status(400).json({ success: false, message: 'Datos inválidos', errors: details });
            return;
        }
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
        return;
    }
};
exports.createActivity = createActivity;
const updateActivity = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const activityId = req.params.id;
        if (!userId) {
            res.status(401).json({ message: 'Usuario no autenticado' });
            return;
        }
        const { name, cropType, plantCount, area, areaUnit, transplantDate, sigpacReference, photos, fertigation, phytosanitary, waterEnergy, location, weather, notes, totalCost } = req.body;
        if (!name || !cropType || area === undefined || totalCost === undefined) {
            res.status(400).json({ message: 'Faltan campos requeridos' });
            return;
        }
        if (area <= 0 || totalCost < 0) {
            res.status(400).json({ message: 'Los valores no pueden ser negativos' });
            return;
        }
        const activity = await Activity_1.default.findOneAndUpdate({ _id: activityId, userId }, {
            name,
            cropType,
            plantCount: plantCount || 0,
            area,
            areaUnit: areaUnit || 'ha',
            transplantDate,
            sigpacReference,
            photos: photos || [],
            fertigation: fertigation || { enabled: false },
            phytosanitary: phytosanitary || { enabled: false },
            waterEnergy: waterEnergy || { enabled: false },
            location,
            weather,
            notes,
            totalCost,
            updatedAt: new Date()
        }, { new: true });
        if (!activity) {
            res.status(404).json({ message: 'Actividad no encontrada' });
            return;
        }
        res.json({
            success: true,
            message: 'Actividad actualizada exitosamente',
            activity
        });
    }
    catch (error) {
        console.error('Error updating activity:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};
exports.updateActivity = updateActivity;
const deleteActivity = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const activityId = req.params.id;
        if (!userId) {
            res.status(401).json({ message: 'Usuario no autenticado' });
            return;
        }
        const activity = await Activity_1.default.findOneAndDelete({ _id: activityId, userId });
        if (!activity) {
            res.status(404).json({ message: 'Actividad no encontrada' });
            return;
        }
        res.json({
            success: true,
            message: 'Actividad eliminada exitosamente'
        });
    }
    catch (error) {
        console.error('Error deleting activity:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};
exports.deleteActivity = deleteActivity;
const getActivityById = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const activityId = req.params.id;
        if (!userId) {
            res.status(401).json({ message: 'Usuario no autenticado' });
            return;
        }
        const activity = await Activity_1.default.findOne({ _id: activityId, userId });
        if (!activity) {
            res.status(404).json({ message: 'Actividad no encontrada' });
            return;
        }
        res.json({
            success: true,
            activity
        });
    }
    catch (error) {
        console.error('Error getting activity:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};
exports.getActivityById = getActivityById;
const addFertigationDay = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const activityId = req.params.activityId;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
        }
        const { date, fertilizers, waterConsumption, waterUnit, notes, totalCost } = req.body;
        if (!date || ((!fertilizers || fertilizers.length === 0) && (!waterConsumption || waterConsumption <= 0))) {
            return res.status(400).json({ success: false, message: 'Debe registrar fertilizantes o consumo de agua' });
        }
        const activity = await Activity_1.default.findOne({ _id: activityId, userId });
        if (!activity) {
            return res.status(404).json({ success: false, message: 'Actividad no encontrada' });
        }
        const newDayRecord = {
            date,
            fertilizers: fertilizers || [],
            waterConsumption: waterConsumption || 0,
            waterUnit: waterUnit || 'L',
            totalCost: totalCost || 0,
            notes
        };
        const ops = (fertilizers || [])
            .filter((f) => !!f.productId && (f.fertilizerAmount || 0) > 0)
            .map((f) => ({ productId: String(f.productId), amount: Number(f.fertilizerAmount) || 0, amountUnit: f.unit || f.fertilizerUnit, context: { activityId, module: 'fertigation', dayIndex: (activity.fertigation?.dailyRecords?.length || 0) } }));
        if (ops.length > 0) {
            const result = await (0, inventoryService_1.adjustStockAtomically)(userId, ops);
            if (!result.ok) {
                return res.status(400).json({ success: false, message: result.error, details: result.details });
            }
        }
        if (!activity.fertigation) {
            activity.fertigation = { enabled: true, dailyRecords: [] };
        }
        activity.fertigation.dailyRecords.push(newDayRecord);
        activity.fertigation.enabled = true;
        activity.totalCost = (activity.totalCost || 0) + (newDayRecord.totalCost || 0);
        await activity.save();
        return res.status(201).json({
            success: true,
            message: 'Día de fertirriego añadido exitosamente',
            dayRecord: newDayRecord,
            activity
        });
    }
    catch (error) {
        console.error('Error adding fertigation day:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};
exports.addFertigationDay = addFertigationDay;
const updateFertigationDay = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { activityId, dayIndex } = req.params;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
        }
        const { date, fertilizers, waterConsumption, waterUnit, notes, totalCost } = req.body;
        const activity = await Activity_1.default.findOne({ _id: activityId, userId });
        if (!activity || !activity.fertigation) {
            return res.status(404).json({ success: false, message: 'Actividad o fertirriego no encontrado' });
        }
        const dayIndexNum = parseInt(dayIndex);
        if (dayIndexNum < 0 || dayIndexNum >= activity.fertigation.dailyRecords.length) {
            return res.status(400).json({ success: false, message: 'Índice de día inválido' });
        }
        const oldRecord = activity.fertigation.dailyRecords[dayIndexNum];
        const oldCost = oldRecord.totalCost;
        const revertOps = (oldRecord.fertilizers || [])
            .filter((f) => !!f.productId && (f.fertilizerAmount || 0) > 0)
            .map((f) => ({ productId: String(f.productId), amount: Number(f.fertilizerAmount) || 0, amountUnit: f.fertilizerUnit || f.unit, operation: 'add' }));
        const newOps = (fertilizers || [])
            .filter((f) => !!f.productId && (f.fertilizerAmount || 0) > 0)
            .map((f) => ({ productId: String(f.productId), amount: Number(f.fertilizerAmount) || 0, amountUnit: f.fertilizerUnit || f.unit, operation: 'subtract' }));
        const ops = [...revertOps, ...newOps];
        if (ops.length > 0) {
            const stockResult = await (0, inventoryService_1.adjustStockAtomically)(userId, ops);
            if (!stockResult.ok) {
                return res.status(400).json({ success: false, message: stockResult.error, details: stockResult.details });
            }
        }
        activity.fertigation.dailyRecords[dayIndexNum] = {
            date,
            fertilizers,
            waterConsumption: waterConsumption || 0,
            waterUnit: waterUnit || 'L',
            totalCost: totalCost || 0,
            notes
        };
        activity.totalCost = (activity.totalCost || 0) - oldCost + (totalCost || 0);
        await activity.save();
        return res.json({
            success: true,
            message: 'Día de fertirriego actualizado exitosamente',
            dayRecord: activity.fertigation.dailyRecords[dayIndexNum]
        });
    }
    catch (error) {
        console.error('Error updating fertigation day:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};
exports.updateFertigationDay = updateFertigationDay;
const deleteFertigationDay = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { activityId, dayIndex } = req.params;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
        }
        const activity = await Activity_1.default.findOne({ _id: activityId, userId });
        if (!activity || !activity.fertigation) {
            return res.status(404).json({ success: false, message: 'Actividad o fertirriego no encontrado' });
        }
        const dayIndexNum = parseInt(dayIndex);
        if (dayIndexNum < 0 || dayIndexNum >= activity.fertigation.dailyRecords.length) {
            return res.status(400).json({ success: false, message: 'Índice de día inválido' });
        }
        const deletedRecord = activity.fertigation.dailyRecords[dayIndexNum];
        const ops = (deletedRecord.fertilizers || [])
            .filter((f) => !!f.productId && (f.fertilizerAmount || 0) > 0)
            .map((f) => ({ productId: String(f.productId), amount: Number(f.fertilizerAmount) || 0, amountUnit: f.fertilizerUnit || f.unit, operation: 'add', context: { activityId, module: 'fertigation', dayIndex: dayIndexNum } }));
        if (ops.length > 0) {
            const stockResult = await (0, inventoryService_1.adjustStockAtomically)(userId, ops);
            if (!stockResult.ok) {
                return res.status(400).json({ success: false, message: stockResult.error, details: stockResult.details });
            }
        }
        const deletedCost = deletedRecord.totalCost;
        activity.totalCost = Math.max(0, (activity.totalCost || 0) - deletedCost);
        activity.fertigation.dailyRecords.splice(dayIndexNum, 1);
        if (activity.fertigation.dailyRecords.length === 0) {
            activity.fertigation.enabled = false;
        }
        await activity.save();
        return res.json({
            success: true,
            message: 'Día de fertirriego eliminado exitosamente',
            activity
        });
    }
    catch (error) {
        console.error('Error deleting fertigation day:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};
exports.deleteFertigationDay = deleteFertigationDay;
const addPhytosanitaryDay = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const activityId = req.params.activityId;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
        }
        const { date, phytosanitaries, notes, totalCost } = req.body;
        if (!date || !phytosanitaries || phytosanitaries.length === 0) {
            return res.status(400).json({ success: false, message: 'Fecha y fitosanitarios son requeridos' });
        }
        const activity = await Activity_1.default.findOne({ _id: activityId, userId });
        if (!activity) {
            return res.status(404).json({ success: false, message: 'Actividad no encontrada' });
        }
        const newDayRecord = {
            date,
            phytosanitaries,
            totalCost: totalCost || 0,
            notes
        };
        const ops = (phytosanitaries || [])
            .filter((p) => !!p.productId && (p.phytosanitaryAmount || 0) > 0)
            .map((p) => ({ productId: String(p.productId), amount: Number(p.phytosanitaryAmount) || 0, amountUnit: p.unit || p.phytosanitaryUnit, context: { activityId, module: 'phytosanitary', dayIndex: (activity.phytosanitary?.dailyRecords?.length || 0) } }));
        if (ops.length > 0) {
            const result = await (0, inventoryService_1.adjustStockAtomically)(userId, ops);
            if (!result.ok) {
                return res.status(400).json({ success: false, message: result.error, details: result.details });
            }
        }
        if (!activity.phytosanitary) {
            activity.phytosanitary = { enabled: true, dailyRecords: [] };
        }
        activity.phytosanitary.dailyRecords.push(newDayRecord);
        activity.phytosanitary.enabled = true;
        activity.totalCost = (activity.totalCost || 0) + (totalCost || 0);
        await activity.save();
        return res.status(201).json({
            success: true,
            message: 'Día de fitosanitarios añadido exitosamente',
            dayRecord: newDayRecord,
            activity
        });
    }
    catch (error) {
        console.error('Error adding phytosanitary day:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};
exports.addPhytosanitaryDay = addPhytosanitaryDay;
const updatePhytosanitaryDay = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { activityId, dayIndex } = req.params;
        if (!userId)
            return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
        const { date, phytosanitaries, totalCost, notes } = req.body;
        const activity = await Activity_1.default.findOne({ _id: activityId, userId });
        if (!activity || !activity.phytosanitary)
            return res.status(404).json({ success: false, message: 'Actividad o fitosanitarios no encontrados' });
        const idx = parseInt(dayIndex);
        if (idx < 0 || idx >= activity.phytosanitary.dailyRecords.length)
            return res.status(400).json({ success: false, message: 'Índice inválido' });
        const oldRecord = activity.phytosanitary.dailyRecords[idx];
        const oldCost = oldRecord.totalCost;
        const revertOps = (oldRecord.phytosanitaries || [])
            .filter((p) => !!p.productId && (p.phytosanitaryAmount || 0) > 0)
            .map((p) => ({ productId: String(p.productId), amount: Number(p.phytosanitaryAmount) || 0, amountUnit: p.phytosanitaryUnit || p.unit, operation: 'add', context: { activityId, module: 'phytosanitary', dayIndex: idx } }));
        const newOps = (phytosanitaries || [])
            .filter((p) => !!p.productId && (p.phytosanitaryAmount || 0) > 0)
            .map((p) => ({ productId: String(p.productId), amount: Number(p.phytosanitaryAmount) || 0, amountUnit: p.phytosanitaryUnit || p.unit, operation: 'subtract', context: { activityId, module: 'phytosanitary', dayIndex: idx } }));
        const ops = [...revertOps, ...newOps];
        if (ops.length > 0) {
            const stockResult = await (0, inventoryService_1.adjustStockAtomically)(userId, ops);
            if (!stockResult.ok) {
                return res.status(400).json({ success: false, message: stockResult.error, details: stockResult.details });
            }
        }
        activity.phytosanitary.dailyRecords[idx] = { date, phytosanitaries, totalCost: totalCost || 0, notes };
        activity.totalCost = (activity.totalCost || 0) - oldCost + (totalCost || 0);
        await activity.save();
        return res.json({ success: true, message: 'Día de fitosanitarios actualizado', dayRecord: activity.phytosanitary.dailyRecords[idx] });
    }
    catch (e) {
        console.error('Error updating phytosanitary day:', e);
        return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};
exports.updatePhytosanitaryDay = updatePhytosanitaryDay;
const deletePhytosanitaryDay = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { activityId, dayIndex } = req.params;
        if (!userId)
            return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
        const activity = await Activity_1.default.findOne({ _id: activityId, userId });
        if (!activity || !activity.phytosanitary)
            return res.status(404).json({ success: false, message: 'Actividad o fitosanitarios no encontrados' });
        const idx = parseInt(dayIndex);
        if (idx < 0 || idx >= activity.phytosanitary.dailyRecords.length)
            return res.status(400).json({ success: false, message: 'Índice inválido' });
        const deletedRecord = activity.phytosanitary.dailyRecords[idx];
        const ops = (deletedRecord.phytosanitaries || [])
            .filter((p) => !!p.productId && (p.phytosanitaryAmount || 0) > 0)
            .map((p) => ({ productId: String(p.productId), amount: Number(p.phytosanitaryAmount) || 0, amountUnit: p.phytosanitaryUnit || p.unit, operation: 'add', context: { activityId, module: 'phytosanitary', dayIndex: idx } }));
        if (ops.length > 0) {
            const stockResult = await (0, inventoryService_1.adjustStockAtomically)(userId, ops);
            if (!stockResult.ok) {
                return res.status(400).json({ success: false, message: stockResult.error, details: stockResult.details });
            }
        }
        const deletedCost = deletedRecord.totalCost;
        activity.totalCost = Math.max(0, (activity.totalCost || 0) - deletedCost);
        activity.phytosanitary.dailyRecords.splice(idx, 1);
        if (activity.phytosanitary.dailyRecords.length === 0)
            activity.phytosanitary.enabled = false;
        await activity.save();
        return res.json({ success: true, message: 'Día de fitosanitarios eliminado', activity });
    }
    catch (e) {
        console.error('Error deleting phytosanitary day:', e);
        return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};
exports.deletePhytosanitaryDay = deletePhytosanitaryDay;
const addWaterDay = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const activityId = req.params.activityId;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
        }
        const { date, consumption, unit, cost, notes } = req.body;
        if (!date || consumption === undefined || consumption <= 0) {
            return res.status(400).json({ success: false, message: 'Fecha y consumo son requeridos' });
        }
        const activity = await Activity_1.default.findOne({ _id: activityId, userId });
        if (!activity) {
            return res.status(404).json({ success: false, message: 'Actividad no encontrada' });
        }
        if (!activity.water) {
            activity.water = { enabled: true, dailyRecords: [] };
        }
        const newWaterRecord = {
            date,
            consumption,
            unit: unit || 'L',
            cost: cost || 0,
            notes
        };
        activity.water.dailyRecords.push(newWaterRecord);
        activity.water.enabled = true;
        activity.totalCost = (activity.totalCost || 0) + (cost || 0);
        await activity.save();
        return res.status(201).json({
            success: true,
            message: 'Día de agua añadido exitosamente',
            waterData: activity.water,
            activity
        });
    }
    catch (error) {
        console.error('Error adding water day:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};
exports.addWaterDay = addWaterDay;
const updateWaterDay = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { activityId, dayIndex } = req.params;
        if (!userId)
            return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
        const { date, consumption, unit, cost, notes } = req.body;
        const activity = await Activity_1.default.findOne({ _id: activityId, userId });
        if (!activity || !activity.water)
            return res.status(404).json({ success: false, message: 'Actividad o agua no encontrados' });
        const idx = parseInt(dayIndex);
        if (idx < 0 || idx >= activity.water.dailyRecords.length)
            return res.status(400).json({ success: false, message: 'Índice inválido' });
        const oldCost = activity.water.dailyRecords[idx].cost;
        activity.water.dailyRecords[idx] = { date, consumption, unit, cost: cost || 0, notes };
        activity.totalCost = (activity.totalCost || 0) - (oldCost || 0) + (cost || 0);
        await activity.save();
        return res.json({ success: true, message: 'Día de agua actualizado', dayRecord: activity.water.dailyRecords[idx] });
    }
    catch (e) {
        console.error('Error updating water day:', e);
        return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};
exports.updateWaterDay = updateWaterDay;
const deleteWaterDay = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { activityId, dayIndex } = req.params;
        if (!userId)
            return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
        const activity = await Activity_1.default.findOne({ _id: activityId, userId });
        if (!activity || !activity.water)
            return res.status(404).json({ success: false, message: 'Actividad o agua no encontrados' });
        const idx = parseInt(dayIndex);
        if (idx < 0 || idx >= activity.water.dailyRecords.length)
            return res.status(400).json({ success: false, message: 'Índice inválido' });
        const deletedCost = activity.water.dailyRecords[idx].cost;
        activity.totalCost = Math.max(0, (activity.totalCost || 0) - (deletedCost || 0));
        activity.water.dailyRecords.splice(idx, 1);
        if (activity.water.dailyRecords.length === 0)
            activity.water.enabled = false;
        await activity.save();
        return res.json({ success: true, message: 'Día de agua eliminado', activity });
    }
    catch (e) {
        console.error('Error deleting water day:', e);
        return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};
exports.deleteWaterDay = deleteWaterDay;
//# sourceMappingURL=dashboardController.js.map