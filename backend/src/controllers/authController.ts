import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { 
  AuthResponse, 
  LoginCredentials, 
  RegisterCredentials, 
  IUserResponse,
  AuthRequest 
} from '../types';

// Generate JWT token
const generateToken = (userId: string): string => {
  const jwtSecret = process.env.JWT_SECRET;
  const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
  
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  
  return jwt.sign({ userId }, jwtSecret, { expiresIn: jwtExpiresIn } as jwt.SignOptions);
};

// Format user response (remove sensitive data)
const formatUserResponse = (user: any): IUserResponse => ({
  _id: user._id.toString(),
  email: user.email,
  name: user.name,
  createdAt: user.createdAt
});

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (
  req: Request<{}, AuthResponse, RegisterCredentials>,
  res: Response<AuthResponse>
): Promise<void> => {
  try {
    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'El usuario ya existe con este email',
        error: 'User already exists'
      });
      return;
    }

    // Create new user
    const user = new User({
      email,
      password,
      name
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id.toString());

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      token,
      user: formatUserResponse(user)
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor durante el registro',
      error: 'Internal server error'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (
  req: Request<{}, AuthResponse, LoginCredentials>,
  res: Response<AuthResponse>
): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user by email and include password field
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
        error: 'Invalid credentials'
      });
      return;
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
        error: 'Invalid credentials'
      });
      return;
    }

    // Generate token
    const token = generateToken(user._id.toString());

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Inicio de sesión exitoso',
      token,
      user: formatUserResponse(user)
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor durante el inicio de sesión',
      error: 'Internal server error'
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
export const getProfile = async (
  req: AuthRequest,
  res: Response<AuthResponse>
): Promise<void> => {
  try {
    const user = req.user;
    
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
        error: 'User not authenticated'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Perfil obtenido exitosamente',
      user: formatUserResponse(user)
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'Internal server error'
    });
  }
};

// @desc    Validate token
// @route   GET /api/auth/validate
// @access  Private
export const validateToken = async (
  req: AuthRequest,
  res: Response<AuthResponse>
): Promise<void> => {
  try {
    const user = req.user;
    
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Token inválido',
        error: 'Invalid token'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Token válido',
      user: formatUserResponse(user)
    });

  } catch (error) {
    console.error('Token validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error validando token',
      error: 'Token validation failed'
    });
  }
};