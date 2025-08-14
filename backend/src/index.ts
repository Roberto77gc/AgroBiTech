import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { DatabaseConnection } from './config/database';
import authRoutes from './routes/auth';
import dashboardRoutes from './routes/dashboard';
import inventoryRoutes from './routes/inventory';
import productRoutes from './routes/products';
import supplierRoutes from './routes/suppliers';
import purchaseRoutes from './routes/purchases';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import templateRoutes from './routes/templates';

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
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
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
  const dbStatus = DatabaseConnection.getInstance().getConnectionStatus();
  res.status(200).json({
    success: true,
    message: 'AgroDigital API is running 🌱',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    database: dbStatus ? 'Connected' : 'Disconnected',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/templates', templateRoutes);

// Legacy routes for compatibility
app.use('/', authRoutes);
app.use('/activities', dashboardRoutes);
app.use('/api/actividades', dashboardRoutes);

// Serve frontend static files (SPA) from Vite build
const clientDistPath = path.resolve(__dirname, '../../agrodigital-mvp/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));

  // SPA fallback: send index.html for non-API routes
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    const indexHtml = path.join(clientDistPath, 'index.html');
    if (fs.existsSync(indexHtml)) {
      return res.sendFile(indexHtml);
    }
    return next();
  });
}

// Root route
app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: '🌱 Bienvenido a AgroDigital API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    documentation: '/api/health',
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
        activities: 'GET /api/dashboard/activities',
        createActivity: 'POST /api/dashboard/activities',
        updateActivity: 'PUT /api/dashboard/activities/:id',
        deleteActivity: 'DELETE /api/dashboard/activities/:id'
      },
      inventory: {
        getUserInventory: 'GET /api/inventory/:userId',
        addProduct: 'POST /api/inventory',
        updateProduct: 'PUT /api/inventory/:productId',
        deleteProduct: 'DELETE /api/inventory/:productId',
        getLowStock: 'GET /api/inventory/:userId/low-stock'
      }
    }
  });
});

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Server configuration
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Start server function
const startServer = async (): Promise<void> => {
  try {
    // Connect to MongoDB
    const db = DatabaseConnection.getInstance();
    await db.connect();

    // Start HTTP server
    const server = app.listen(PORT, () => {
      console.log(`
🌱 ================================
🚀 AgroDigital Backend Server
💎 Enterprise Grade Architecture
🌍 Environment: ${NODE_ENV}
📡 Port: ${PORT}
🔗 URL: http://localhost:${PORT}
🏥 Health: http://localhost:${PORT}/api/health
📊 Database: MongoDB Atlas Connected
🔐 Security: JWT + Rate Limiting + Helmet
⚡ Performance: Optimized

🎯 Ready for Production!
🌱 ================================
      `);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string): Promise<void> => {
      console.log(`\n⚠️  Received ${signal}. Starting graceful shutdown...`);
      
      server.close(async () => {
        console.log('🔌 HTTP server closed');
        await db.disconnect();
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