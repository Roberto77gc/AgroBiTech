"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.checkUsers = exports.deleteAccount = exports.changePassword = exports.updateProfile = exports.getProfile = exports.login = exports.register = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Todos los campos son requeridos' });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
        }
        const existingUser = await User_1.default.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'El usuario ya existe' });
        }
        const user = new User_1.default({
            name,
            email,
            password
        });
        await user.save();
        const token = jsonwebtoken_1.default.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '7d' });
        return res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    }
    catch (error) {
        console.error('Error in register:', error);
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email y contraseña son requeridos' });
        }
        const user = await User_1.default.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '7d' });
        return res.json({
            success: true,
            message: 'Login exitoso',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    }
    catch (error) {
        console.error('Error in login:', error);
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
};
exports.login = login;
const getProfile = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Usuario no autenticado' });
        }
        const user = await User_1.default.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        return res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    }
    catch (error) {
        console.error('Error getting profile:', error);
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
};
exports.getProfile = getProfile;
const updateProfile = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Usuario no autenticado' });
        }
        const { name, email } = req.body;
        if (!name || !email) {
            return res.status(400).json({ message: 'Nombre y email son requeridos' });
        }
        const existingUser = await User_1.default.findOne({ email, _id: { $ne: userId } });
        if (existingUser) {
            return res.status(400).json({ message: 'El email ya está en uso' });
        }
        const user = await User_1.default.findByIdAndUpdate(userId, { name, email }, { new: true }).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        return res.json({
            success: true,
            message: 'Perfil actualizado exitosamente',
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    }
    catch (error) {
        console.error('Error updating profile:', error);
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
};
exports.updateProfile = updateProfile;
const changePassword = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Usuario no autenticado' });
        }
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Contraseña actual y nueva contraseña son requeridas' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 6 caracteres' });
        }
        const user = await User_1.default.findById(userId).select('+password');
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        const isCurrentPasswordValid = await user.comparePassword(currentPassword);
        if (!isCurrentPasswordValid) {
            return res.status(401).json({ message: 'Contraseña actual incorrecta' });
        }
        user.password = newPassword;
        await user.save();
        return res.json({
            success: true,
            message: 'Contraseña cambiada exitosamente'
        });
    }
    catch (error) {
        console.error('Error changing password:', error);
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
};
exports.changePassword = changePassword;
const deleteAccount = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Usuario no autenticado' });
        }
        const { password } = req.body;
        if (!password) {
            return res.status(400).json({ message: 'Contraseña es requerida para eliminar la cuenta' });
        }
        const user = await User_1.default.findById(userId).select('+password');
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Contraseña incorrecta' });
        }
        await User_1.default.findByIdAndDelete(userId);
        return res.json({
            success: true,
            message: 'Cuenta eliminada exitosamente'
        });
    }
    catch (error) {
        console.error('Error deleting account:', error);
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
};
exports.deleteAccount = deleteAccount;
const checkUsers = async (_req, res) => {
    try {
        const users = await User_1.default.find({}, { password: 0 });
        return res.json({
            success: true,
            users: users.map(user => ({
                id: user._id,
                name: user.name,
                email: user.email,
                createdAt: user.createdAt
            }))
        });
    }
    catch (error) {
        console.error('Error in checkUsers:', error);
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
};
exports.checkUsers = checkUsers;
const resetPassword = async (req, res) => {
    try {
        const { email, newPassword } = req.body;
        if (!email || !newPassword) {
            return res.status(400).json({ message: 'Email y nueva contraseña son requeridos' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
        }
        const user = await User_1.default.findOne({ email }).select('+password');
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        user.password = newPassword;
        await user.save();
        return res.json({
            success: true,
            message: 'Contraseña reseteada exitosamente'
        });
    }
    catch (error) {
        console.error('Error in resetPassword:', error);
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
};
exports.resetPassword = resetPassword;
//# sourceMappingURL=authController.js.map