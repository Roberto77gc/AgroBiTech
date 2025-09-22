import express from 'express';
import { DatabaseConnection } from '../config/database';
import { sendEmail } from '../services/emailService';
import { sendEmailWithSendGrid } from '../services/sendgridService';
import { validateEmail } from '../utils/validation';

const router = express.Router();

// Rate limiting para prevenir spam
const waitlistAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutos

// Middleware de rate limiting
const rateLimit = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  
  if (!waitlistAttempts.has(ip)) {
    waitlistAttempts.set(ip, { count: 1, lastAttempt: now });
    return next();
  }
  
  const attempts = waitlistAttempts.get(ip)!;
  
  // Reset si ha pasado el tiempo límite
  if (now - attempts.lastAttempt > RATE_LIMIT_WINDOW) {
    attempts.count = 1;
    attempts.lastAttempt = now;
    return next();
  }
  
  // Verificar límite
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

// POST /api/waitlist - Suscribirse a la lista de espera (v1.0.1)
router.post('/', rateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const { email, source = 'landing_page', language = 'es' } = req.body;
    
    // Validaciones
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email es requerido'
      });
    }
    
    if (!validateEmail(email)) {
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
    
    // Conectar a la base de datos
    const db = DatabaseConnection.getInstance();
    const collection = db.getCollection('waitlist');
    
    // Verificar si el email ya existe
    const existingUser = await collection.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Este email ya está registrado en nuestra lista de espera'
      });
    }
    
    // Crear registro en la base de datos
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
    
    // Enviar email de notificación a contacto@agrobitech.com
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
    
    // Intentar con SendGrid primero (más confiable)
    if (process.env.SENDGRID_API_KEY) {
      try {
        console.log('📧 Enviando email con SendGrid a contacto@agrobitech.com...');
        const sendGridResult = await sendEmailWithSendGrid({
          to: 'contacto@agrobitech.com',
          subject,
          html: emailBody
        });
        
        if (sendGridResult.success) {
          console.log('✅ Email enviado exitosamente con SendGrid:', sendGridResult.messageId);
        } else {
          console.error('❌ Error con SendGrid:', sendGridResult.error);
          throw new Error(sendGridResult.error);
        }
      } catch (sendGridError) {
        console.error('❌ SendGrid falló, intentando con SMTP...', sendGridError);
        // Fallback a SMTP
        try {
          const emailResult = await sendEmail({
            to: 'contacto@agrobitech.com',
            subject,
            html: emailBody
          });
          console.log('✅ Email enviado exitosamente con SMTP:', emailResult);
        } catch (smtpError) {
          console.error('❌ Error con SMTP también:', smtpError);
        }
      }
    } else {
      // Solo SMTP si no hay SendGrid
      try {
        console.log('📧 Enviando email con SMTP a contacto@agrobitech.com...');
        const emailResult = await sendEmail({
          to: 'contacto@agrobitech.com',
          subject,
          html: emailBody
        });
        console.log('✅ Email enviado exitosamente con SMTP:', emailResult);
      } catch (emailError) {
        console.error('❌ Error enviando email de notificación:', emailError);
        console.error('❌ Detalles del error:', {
          message: emailError.message,
          code: emailError.code,
          response: emailError.response
        });
      }
    }
    
    // Respuesta de éxito
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
    
  } catch (error) {
    console.error('Error en waitlist:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor. Por favor, inténtalo de nuevo más tarde.'
    });
    return;
  }
});

// GET /api/waitlist/stats - Estadísticas de la lista de espera (solo para admin)
router.get('/stats', async (_req: express.Request, res: express.Response) => {
  try {
    const db = DatabaseConnection.getInstance();
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
    
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo estadísticas'
    });
    return;
  }
});

export default router;
