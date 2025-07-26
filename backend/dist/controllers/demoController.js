"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.demoActivities = exports.demoDashboardStats = exports.demoValidateToken = exports.demoGetProfile = exports.demoRegister = exports.demoLogin = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const demoUsers = [
    {
        _id: '675a1234567890abcdef1234',
        email: 'agricultor@demo.com',
        name: 'José García',
        createdAt: new Date('2024-01-15')
    },
    {
        _id: '675a1234567890abcdef5678',
        email: 'maria@demo.com',
        name: 'María López',
        createdAt: new Date('2024-02-20')
    }
];
const demoPasswords = {
    'agricultor@demo.com': 'demo123',
    'maria@demo.com': 'demo123'
};
const generateToken = (userId) => {
    const jwtSecret = process.env.JWT_SECRET || 'demo-secret';
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
    return jsonwebtoken_1.default.sign({ userId }, jwtSecret, { expiresIn: jwtExpiresIn });
};
const demoStats = {
    totalActivities: 42,
    totalCost: 15420.50,
    averageCostPerHectare: 2847.30,
    activitiesThisMonth: 8,
    topCropTypes: [
        { crop: 'Tomate', count: 15, totalCost: 6200.00 },
        { crop: 'Lechuga', count: 12, totalCost: 4100.00 },
        { crop: 'Pimiento', count: 8, totalCost: 3200.00 },
        { crop: 'Calabacín', count: 7, totalCost: 1920.50 }
    ],
    monthlyStats: [
        { month: 'ene 2024', activities: 5, cost: 1200.00 },
        { month: 'feb 2024', activities: 7, cost: 1800.00 },
        { month: 'mar 2024', activities: 6, cost: 1500.00 },
        { month: 'abr 2024', activities: 8, cost: 2100.00 },
        { month: 'may 2024', activities: 4, cost: 950.00 },
        { month: 'jun 2024', activities: 9, cost: 2300.00 },
        { month: 'jul 2024', activities: 3, cost: 800.00 }
    ],
    recentActivities: [
        {
            _id: '675a9876543210fedcba9876',
            name: 'Riego y Fertilización',
            cropType: 'Tomate',
            variety: 'Cherry',
            date: '2024-07-25',
            totalCost: 145.50,
            plantsCount: 250,
            surfaceArea: 0.8,
            createdAt: new Date('2024-07-25')
        },
        {
            _id: '675a9876543210fedcba9877',
            name: 'Tratamiento Fitosanitario',
            cropType: 'Lechuga',
            variety: 'Romana',
            date: '2024-07-24',
            totalCost: 89.20,
            plantsCount: 180,
            surfaceArea: 0.6,
            createdAt: new Date('2024-07-24')
        }
    ]
};
const demoLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = demoUsers.find(u => u.email === email);
        if (!user || demoPasswords[email] !== password) {
            res.status(401).json({
                success: false,
                message: 'Credenciales inválidas',
                error: 'Invalid credentials'
            });
            return;
        }
        const token = generateToken(user._id);
        res.status(200).json({
            success: true,
            message: 'Inicio de sesión exitoso - Modo Demo',
            token,
            user
        });
    }
    catch (error) {
        console.error('Demo login error:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: 'Internal server error'
        });
    }
};
exports.demoLogin = demoLogin;
const demoRegister = async (req, res) => {
    try {
        const { email, name } = req.body;
        if (demoUsers.find(u => u.email === email)) {
            res.status(400).json({
                success: false,
                message: 'El usuario ya existe con este email',
                error: 'User already exists'
            });
            return;
        }
        const newUser = {
            _id: `demo_${Date.now()}`,
            email,
            name,
            createdAt: new Date()
        };
        demoUsers.push(newUser);
        demoPasswords[email] = 'demo123';
        const token = generateToken(newUser._id);
        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente - Modo Demo',
            token,
            user: newUser
        });
    }
    catch (error) {
        console.error('Demo registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: 'Internal server error'
        });
    }
};
exports.demoRegister = demoRegister;
const demoGetProfile = async (req, res) => {
    try {
        const user = demoUsers[0];
        res.status(200).json({
            success: true,
            message: 'Perfil obtenido exitosamente - Modo Demo',
            user
        });
    }
    catch (error) {
        console.error('Demo get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: 'Internal server error'
        });
    }
};
exports.demoGetProfile = demoGetProfile;
const demoValidateToken = async (req, res) => {
    try {
        const user = demoUsers[0];
        res.status(200).json({
            success: true,
            message: 'Token válido - Modo Demo',
            user
        });
    }
    catch (error) {
        console.error('Demo token validation error:', error);
        res.status(500).json({
            success: false,
            message: 'Error validando token',
            error: 'Token validation failed'
        });
    }
};
exports.demoValidateToken = demoValidateToken;
const demoDashboardStats = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            message: 'Estadísticas del dashboard obtenidas exitosamente - Modo Demo',
            data: demoStats
        });
    }
    catch (error) {
        console.error('Demo dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: 'Internal server error'
        });
    }
};
exports.demoDashboardStats = demoDashboardStats;
const demoActivities = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const activities = demoStats.recentActivities.slice(0, Number(limit));
        res.status(200).json({
            success: true,
            message: 'Actividades obtenidas exitosamente - Modo Demo',
            data: activities,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total: demoStats.recentActivities.length,
                pages: Math.ceil(demoStats.recentActivities.length / Number(limit))
            }
        });
    }
    catch (error) {
        console.error('Demo activities error:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: 'Internal server error'
        });
    }
};
exports.demoActivities = demoActivities;
//# sourceMappingURL=demoController.js.map