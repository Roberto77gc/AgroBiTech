import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { 
  AuthResponse, 
  LoginCredentials, 
  RegisterCredentials, 
  IUserResponse,
  AuthRequest,
  ApiResponse 
} from '../types';

// Mock data for demo
const demoUsers: IUserResponse[] = [
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

const demoPasswords: { [email: string]: string } = {
  'agricultor@demo.com': 'demo123',
  'maria@demo.com': 'demo123'
};

// Generate JWT token
const generateToken = (userId: string): string => {
  const jwtSecret = process.env.JWT_SECRET || 'demo-secret';
  const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign({ userId }, jwtSecret, { expiresIn: jwtExpiresIn } as jwt.SignOptions);
};

// Demo Stats
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

// @desc    Demo Login
// @route   POST /api/auth/login
// @access  Public
export const demoLogin = async (
  req: Request<{}, AuthResponse, LoginCredentials>,
  res: Response<AuthResponse>
): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find demo user
    const user = demoUsers.find(u => u.email === email);
    
    if (!user || demoPasswords[email] !== password) {
      res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
        error: 'Invalid credentials'
      });
      return;
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Inicio de sesión exitoso - Modo Demo',
      token,
      user
    });

  } catch (error) {
    console.error('Demo login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'Internal server error'
    });
  }
};

// @desc    Demo Register
// @route   POST /api/auth/register
// @access  Public
export const demoRegister = async (
  req: Request<{}, AuthResponse, RegisterCredentials>,
  res: Response<AuthResponse>
): Promise<void> => {
  try {
    const { email, name } = req.body;

    // Check if user exists
    if (demoUsers.find(u => u.email === email)) {
      res.status(400).json({
        success: false,
        message: 'El usuario ya existe con este email',
        error: 'User already exists'
      });
      return;
    }

    // Create new demo user
    const newUser: IUserResponse = {
      _id: `demo_${Date.now()}`,
      email,
      name,
      createdAt: new Date()
    };

    demoUsers.push(newUser);
    demoPasswords[email] = 'demo123'; // Default demo password

    const token = generateToken(newUser._id);

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente - Modo Demo',
      token,
      user: newUser
    });

  } catch (error) {
    console.error('Demo registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'Internal server error'
    });
  }
};

// @desc    Demo Profile
// @route   GET /api/auth/profile
// @access  Private
export const demoGetProfile = async (
  _req: AuthRequest,
  res: Response<AuthResponse>
): Promise<void> => {
  try {
    // In demo mode, we'll just return the first demo user
    const user = demoUsers[0];

    res.status(200).json({
      success: true,
      message: 'Perfil obtenido exitosamente - Modo Demo',
      user
    });

  } catch (error) {
    console.error('Demo get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'Internal server error'
    });
  }
};

// @desc    Demo Validate Token
// @route   GET /api/auth/validate
// @access  Private
export const demoValidateToken = async (
  _req: AuthRequest,
  res: Response<AuthResponse>
): Promise<void> => {
  try {
    const user = demoUsers[0];

    res.status(200).json({
      success: true,
      message: 'Token válido - Modo Demo',
      user
    });

  } catch (error) {
    console.error('Demo token validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error validando token',
      error: 'Token validation failed'
    });
  }
};

// @desc    Demo Dashboard Stats
// @route   GET /api/dashboard
// @access  Private
export const demoDashboardStats = async (
  _req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    res.status(200).json({
      success: true,
      message: 'Estadísticas del dashboard obtenidas exitosamente - Modo Demo',
      data: demoStats
    });

  } catch (error) {
    console.error('Demo dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'Internal server error'
    });
  }
};

// @desc    Demo Activities
// @route   GET /api/dashboard/activities
// @access  Private
export const demoActivities = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
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

  } catch (error) {
    console.error('Demo activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'Internal server error'
    });
  }
};