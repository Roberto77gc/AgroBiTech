"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateToken = exports.getProfile = exports.login = exports.register = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const generateToken = (userId) => {
    const jwtSecret = process.env.JWT_SECRET;
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
    if (!jwtSecret) {
        throw new Error('JWT_SECRET is not defined in environment variables');
    }
    return jsonwebtoken_1.default.sign({ userId }, jwtSecret, { expiresIn: jwtExpiresIn });
};
const formatUserResponse = (user) => ({
    _id: user._id.toString(),
    email: user.email,
    name: user.name,
    createdAt: user.createdAt
});
const register = async (req, res) => {
    try {
        const { email, password, name } = req.body;
        const existingUser = await User_1.default.findOne({ email });
        if (existingUser) {
            res.status(400).json({
                success: false,
                message: 'El usuario ya existe con este email',
                error: 'User already exists'
            });
            return;
        }
        const user = new User_1.default({
            email,
            password,
            name
        });
        await user.save();
        const token = generateToken(user._id.toString());
        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            token,
            user: formatUserResponse(user)
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor durante el registro',
            error: 'Internal server error'
        });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User_1.default.findOne({ email }).select('+password');
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Credenciales inválidas',
                error: 'Invalid credentials'
            });
            return;
        }
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            res.status(401).json({
                success: false,
                message: 'Credenciales inválidas',
                error: 'Invalid credentials'
            });
            return;
        }
        const token = generateToken(user._id.toString());
        res.status(200).json({
            success: true,
            message: 'Inicio de sesión exitoso',
            token,
            user: formatUserResponse(user)
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor durante el inicio de sesión',
            error: 'Internal server error'
        });
    }
};
exports.login = login;
const getProfile = async (req, res) => {
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
    }
    catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: 'Internal server error'
        });
    }
};
exports.getProfile = getProfile;
const validateToken = async (req, res) => {
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
    }
    catch (error) {
        console.error('Token validation error:', error);
        res.status(500).json({
            success: false,
            message: 'Error validando token',
            error: 'Token validation failed'
        });
    }
};
exports.validateToken = validateToken;
//# sourceMappingURL=authController.js.map