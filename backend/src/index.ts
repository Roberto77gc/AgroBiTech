import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import demoRoutes from './routes/demo';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    error: 'Rate limit exceeded'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api', limiter);

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'AgroDigital API is running - Demo Mode 🌱',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    mode: 'demo'
  });
});

// Demo routes (no database required)
app.use('/api', demoRoutes);

// Root route
app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: '🌱 Bienvenido a AgroDigital API - Demo Mode',
    version: '1.0.0',
    mode: 'demo',
    environment: process.env.NODE_ENV || 'development',
    documentation: '/api/health',
    demo: {
      credentials: {
        email: 'agricultor@demo.com',
        password: 'demo123'
      },
      note: 'Este es un modo demo sin base de datos. Los datos son simulados para demostración.'
    },
    endpoints: {
      health: 'GET /api/health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        profile: 'GET /api/auth/profile',
        validate: 'GET /api/auth/validate'
      },
      dashboard: {
        stats: 'GET /api/dashboard',
        activities: 'GET /api/dashboard/activities'
      }
    }
  });
});

// 404 handler for non-API routes
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Server configuration
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Start server function
const startServer = async (): Promise<void> => {
  try {
    // Start HTTP server (no database connection needed in demo mode)
    const server = app.listen(PORT, () => {
      console.log(`
🌱 ================================
🚀 AgroDigital Backend Server
🎭 Mode: DEMO (No Database)
🌍 Environment: ${NODE_ENV}
📡 Port: ${PORT}
🔗 URL: http://localhost:${PORT}
🏥 Health: http://localhost:${PORT}/api/health
📚 API Docs: http://localhost:${PORT}

🎯 Demo Credentials:
   Email: agricultor@demo.com
   Password: demo123

🌱 ================================
      `);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string): Promise<void> => {
      console.log(`\n⚠️  Received ${signal}. Starting graceful shutdown...`);
      
      server.close(() => {
        console.log('🔌 HTTP server closed');
        console.log('✅ Graceful shutdown completed');
        process.exit(0);
      });
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('UNHANDLED_REJECTION');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

export default app;