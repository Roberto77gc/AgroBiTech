"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.forgotPassword = exports.validateResetToken = exports.resetPassword = exports.checkUsers = exports.deleteAccount = exports.changePassword = exports.updateProfile = exports.getProfile = exports.login = exports.register = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const crypto_1 = __importDefault(require("crypto"));
const emailService_1 = require("../services/emailService");
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
        const { token, newPassword } = req.body;
        if (!token || !newPassword) {
            return res.status(400).json({ message: 'Token y nueva contraseña son requeridos' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
        }
        const hashedToken = crypto_1.default.createHash('sha256').update(String(token)).digest('hex');
        const user = await User_1.default.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: new Date() }
        }).select('+password');
        if (!user) {
            return res.status(400).json({ message: 'Token inválido o expirado' });
        }
        user.password = newPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        return res.json({ success: true, message: 'Contraseña restablecida exitosamente' });
    }
    catch (error) {
        console.error('Error in resetPassword:', error);
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
};
exports.resetPassword = resetPassword;
const validateResetToken = async (req, res) => {
    try {
        const token = String(req.query.token || req.body?.token || '');
        if (!token) {
            return res.status(400).json({ message: 'Token requerido' });
        }
        const hashedToken = crypto_1.default.createHash('sha256').update(token).digest('hex');
        const user = await User_1.default.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: new Date() }
        }).select('_id');
        if (!user) {
            return res.status(400).json({ message: 'Token inválido o expirado' });
        }
        return res.status(200).json({ success: true });
    }
    catch (error) {
        console.error('Error in validateResetToken:', error);
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
};
exports.validateResetToken = validateResetToken;
const forgotPassword = async (req, res) => {
    try {
        const email = String((req.body && req.body.email) || '');
        if (!email) {
            return res.status(400).json({ message: 'Email es requerido' });
        }
        const user = await User_1.default.findOne({ email });
        if (user) {
            const rawToken = crypto_1.default.randomBytes(32).toString('hex');
            const hashedToken = crypto_1.default.createHash('sha256').update(rawToken).digest('hex');
            const expires = new Date(Date.now() + 1000 * 60 * 30);
            user.resetPasswordToken = hashedToken;
            user.resetPasswordExpires = expires;
            await user.save();
            const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            const resetUrl = `${baseUrl}/reset?token=${rawToken}`;
            const { previewUrl } = await (0, emailService_1.sendEmail)({
                to: email,
                subject: 'Recupera tu contraseña - AgroBiTech',
                text: `Para restablecer tu contraseña, visita: ${resetUrl}`,
                html: `<p>Has solicitado restablecer tu contraseña.</p><p><a href="${resetUrl}">Restablecer contraseña</a></p><p>Si no fuiste tú, ignora este mensaje.</p>`
            });
            if (previewUrl) {
                console.log('📧 Preview email URL:', previewUrl);
            }
        }
        return res.status(200).json({
            success: true,
            message: 'Si el correo existe, enviaremos instrucciones de recuperación.'
        });
    }
    catch (error) {
        console.error('Error in forgotPassword:', error);
        return res.status(200).json({ success: true });
    }
};
exports.forgotPassword = forgotPassword;
//# sourceMappingURL=authController.js.map