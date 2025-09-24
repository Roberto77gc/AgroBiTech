"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = require("../config/database");
const emailService_1 = require("../services/emailService");
const sendgridService_1 = require("../services/sendgridService");
const validation_1 = require("../utils/validation");
const router = express_1.default.Router();
const waitlistAttempts = new Map();
const MAX_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW = 15 * 60 * 1000;
const rateLimit = (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    if (!waitlistAttempts.has(ip)) {
        waitlistAttempts.set(ip, { count: 1, lastAttempt: now });
        return next();
    }
    const attempts = waitlistAttempts.get(ip);
    if (now - attempts.lastAttempt > RATE_LIMIT_WINDOW) {
        attempts.count = 1;
        attempts.lastAttempt = now;
        return next();
    }
    if (attempts.count >= MAX_ATTEMPTS) {
        return res.status(429).json({
            success: false,
            message: 'Demasiados intentos. Por favor, espera 15 minutos antes de intentar de nuevo.',
            retryAfter: Math.ceil((RATE_LIMIT_WINDOW - (now - attempts.lastAttempt)) / 1000)
        });
    }
    attempts.count++;
    attempts.lastAttempt = now;
    next();
};
router.post('/', rateLimit, async (req, res) => {
    try {
        console.log('🔍 DEBUG: SENDGRID_API_KEY está configurada:', !!process.env.SENDGRID_API_KEY);
        console.log('🔍 DEBUG: Valor parcial de SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? process.env.SENDGRID_API_KEY.substring(0, 5) + '...' : 'No definida');
        console.log('🔍 DEBUG: EMAIL_FROM:', process.env.EMAIL_FROM);
        console.log('🔍 DEBUG: Todas las variables de entorno relacionadas con email:', {
            SENDGRID_API_KEY: !!process.env.SENDGRID_API_KEY,
            EMAIL_FROM: process.env.EMAIL_FROM,
            SMTP_HOST: process.env.SMTP_HOST,
            SMTP_USER: process.env.SMTP_USER
        });
        const { email, source = 'landing_page', language = 'es' } = req.body;
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email es requerido'
            });
        }
        if (!(0, validation_1.validateEmail)(email)) {
            return res.status(400).json({
                success: false,
                message: 'Formato de email inválido'
            });
        }
        if (!['es', 'en'].includes(language)) {
            return res.status(400).json({
                success: false,
                message: 'Idioma debe ser "es" o "en"'
            });
        }
        const db = database_1.DatabaseConnection.getInstance();
        const collection = db.getCollection('waitlist');
        const existingUser = await collection.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Este email ya está en nuestra lista de espera. Te avisaremos cuando esté listo para probar.',
                alreadySubscribed: true
            });
        }
        const waitlistEntry = {
            email: email.toLowerCase(),
            source,
            language,
            subscribedAt: new Date(),
            ip: req.ip || req.connection.remoteAddress || 'unknown',
            userAgent: req.get('User-Agent') || 'unknown',
            status: 'active'
        };
        const result = await collection.insertOne(waitlistEntry);
        const subject = `Nueva suscripción a lista de espera - AgroBiTech`;
        const emailBody = `
      <h2>🌱 Nueva suscripción a la lista de espera</h2>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Idioma:</strong> ${language === 'es' ? 'Español' : 'English'}</p>
      <p><strong>Fuente:</strong> ${source}</p>
      <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
      <p><strong>IP:</strong> ${req.ip || 'unknown'}</p>
      
      <hr>
      <p><em>Este email fue enviado automáticamente desde la landing page de AgroBiTech.</em></p>
    `;
        const hasSendGrid = process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY.trim() !== '';
        console.log('🔍 DEBUG: ¿Tiene SendGrid configurado?', hasSendGrid);
        if (hasSendGrid) {
            try {
                console.log('📧 Enviando email con SendGrid a contacto@agrobitech.com...');
                const sendGridResult = await (0, sendgridService_1.sendEmailWithSendGrid)({
                    to: 'contacto@agrobitech.com',
                    subject,
                    html: emailBody
                });
                if (sendGridResult.success) {
                    console.log('✅ Email enviado exitosamente con SendGrid:', sendGridResult.messageId);
                }
                else {
                    console.error('❌ Error con SendGrid:', sendGridResult.error);
                    throw new Error(sendGridResult.error);
                }
            }
            catch (sendGridError) {
                console.error('❌ SendGrid falló, intentando con SMTP...', sendGridError);
                try {
                    const emailResult = await (0, emailService_1.sendEmail)({
                        to: 'contacto@agrobitech.com',
                        subject,
                        html: emailBody
                    });
                    console.log('✅ Email enviado exitosamente con SMTP:', emailResult);
                }
                catch (smtpError) {
                    console.error('❌ Error con SMTP también:', smtpError);
                }
            }
        }
        else {
            try {
                console.log('📧 Enviando email con SMTP a contacto@agrobitech.com...');
                const emailResult = await (0, emailService_1.sendEmail)({
                    to: 'contacto@agrobitech.com',
                    subject,
                    html: emailBody
                });
                console.log('✅ Email enviado exitosamente con SMTP:', emailResult);
            }
            catch (emailError) {
                console.error('❌ Error enviando email de notificación:', emailError);
                console.error('❌ Detalles del error:', {
                    message: emailError instanceof Error ? emailError.message : String(emailError),
                    code: emailError?.code || 'unknown',
                    response: emailError?.response || 'unknown'
                });
            }
        }
        res.status(201).json({
            success: true,
            message: language === 'es'
                ? '¡Gracias! Te hemos añadido a la lista de espera. Te contactaremos pronto.'
                : 'Thank you! We have added you to the waitlist. We will contact you soon.',
            data: {
                id: result.insertedId,
                email: email.toLowerCase(),
                language,
                subscribedAt: waitlistEntry.subscribedAt
            }
        });
        return;
    }
    catch (error) {
        console.error('Error en waitlist:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor. Por favor, inténtalo de nuevo más tarde.'
        });
        return;
    }
});
router.get('/stats', async (_req, res) => {
    try {
        const db = database_1.DatabaseConnection.getInstance();
        const collection = db.getCollection('waitlist');
        const totalSubscriptions = await collection.countDocuments({ status: 'active' });
        const subscriptionsByLanguage = await collection.aggregate([
            { $match: { status: 'active' } },
            { $group: { _id: '$language', count: { $sum: 1 } } }
        ]).toArray();
        const subscriptionsBySource = await collection.aggregate([
            { $match: { status: 'active' } },
            { $group: { _id: '$source', count: { $sum: 1 } } }
        ]).toArray();
        const recentSubscriptions = await collection.find({ status: 'active' })
            .sort({ subscribedAt: -1 })
            .limit(10)
            .toArray();
        res.json({
            success: true,
            data: {
                totalSubscriptions,
                byLanguage: subscriptionsByLanguage,
                bySource: subscriptionsBySource,
                recent: recentSubscriptions
            }
        });
    }
    catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo estadísticas'
        });
        return;
    }
});
exports.default = router;
//# sourceMappingURL=waitlist.js.map