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
const demo_1 = __importDefault(require("./routes/demo"));
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
    res.status(200).json({
        success: true,
        message: 'AgroDigital API is running - Demo Mode 🌱',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        mode: 'demo'
    });
});
app.use('/api', demo_1.default);
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
app.use(errorHandler_1.notFoundHandler);
app.use(errorHandler_1.errorHandler);
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const startServer = async () => {
    try {
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
        const gracefulShutdown = async (signal) => {
            console.log(`\n⚠️  Received ${signal}. Starting graceful shutdown...`);
            server.close(() => {
                console.log('🔌 HTTP server closed');
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