"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("./config/database");
const auth_1 = __importDefault(require("./routes/auth"));
const dashboard_1 = __importDefault(require("./routes/dashboard"));
const inventory_1 = __importDefault(require("./routes/inventory"));
const products_1 = __importDefault(require("./routes/products"));
const suppliers_1 = __importDefault(require("./routes/suppliers"));
const purchases_1 = __importDefault(require("./routes/purchases"));
const errorHandler_1 = require("./middleware/errorHandler");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.set('trust proxy', 1);
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};
app.use((0, cors_1.default)(corsOptions));
const limiter = (0, express_rate_limit_1.default)({
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
if (process.env.NODE_ENV === 'development') {
    app.use((0, morgan_1.default)('dev'));
}
else {
    app.use((0, morgan_1.default)('combined'));
}
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.get('/api/health', (_req, res) => {
    const dbStatus = database_1.DatabaseConnection.getInstance().getConnectionStatus();
    res.status(200).json({
        success: true,
        message: 'AgroDigital API is running 🌱',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        database: dbStatus ? 'Connected' : 'Disconnected',
        environment: process.env.NODE_ENV || 'development'
    });
});
app.use('/api/auth', auth_1.default);
app.use('/api/dashboard', dashboard_1.default);
app.use('/api/inventory', inventory_1.default);
app.use('/api/products', products_1.default);
app.use('/api/suppliers', suppliers_1.default);
app.use('/api/purchases', purchases_1.default);
app.use('/', auth_1.default);
app.use('/activities', dashboard_1.default);
app.use('/api/actividades', dashboard_1.default);
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
app.use(errorHandler_1.notFoundHandler);
app.use(errorHandler_1.errorHandler);
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const startServer = async () => {
    try {
        const db = database_1.DatabaseConnection.getInstance();
        await db.connect();
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
        const gracefulShutdown = async (signal) => {
            console.log(`\n⚠️  Received ${signal}. Starting graceful shutdown...`);
            server.close(async () => {
                console.log('🔌 HTTP server closed');
                await db.disconnect();
                console.log('✅ Graceful shutdown completed');
                process.exit(0);
            });
        };
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        process.on('uncaughtException', (error) => {
            console.error('❌ Uncaught Exception:', error);
            gracefulShutdown('UNCAUGHT_EXCEPTION');
        });
        process.on('unhandledRejection', (reason, promise) => {
            console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
            gracefulShutdown('UNHANDLED_REJECTION');
        });
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};
startServer();
exports.default = app;
//# sourceMappingURL=index.js.map