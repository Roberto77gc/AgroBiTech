# 🚀 Deployment de AgroDigital

## 📋 **PREPARACIÓN PARA PRODUCCIÓN**

### **1. Variables de Entorno de Producción**

#### **Backend (.env.production)**
```bash
PORT=3000
NODE_ENV=production
JWT_SECRET=SECRETO_SUPER_SEGURO_PRODUCCION
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/agrodigital_prod
CORS_ORIGINS=https://agrodigital.es,https://www.agrodigital.es
```

#### **Frontend (.env.production)**
```bash
VITE_API_BASE_URL=https://api.agrodigital.es/api
VITE_APP_NAME=AgroDigital
VITE_APP_VERSION=1.0.0
VITE_DEV_MODE=false
```

### **2. Build de Producción**

#### **Backend**
```bash
cd backend
npm run build
# El resultado estará en dist/
```

#### **Frontend**
```bash
cd agrodigital-mvp
npm run build
# El resultado estará en dist/
```

## 🌐 **PLATAFORMAS DE DEPLOYMENT**

### **Backend - Railway/Heroku**

#### **Railway**
1. Conectar repositorio GitHub
2. Configurar variables de entorno
3. Deploy automático en push a main

#### **Heroku**
```bash
# Instalar Heroku CLI
heroku create agrodigital-api
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=tu_secreto
heroku config:set MONGODB_URI=tu_uri
git push heroku main
```

### **Frontend - Vercel/Netlify**

#### **Vercel**
1. Conectar repositorio GitHub
2. Configurar build command: `npm run build`
3. Output directory: `dist`
4. Deploy automático

#### **Netlify**
1. Conectar repositorio GitHub
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Deploy automático

## 🔒 **SEGURIDAD EN PRODUCCIÓN**

### **1. JWT Secret**
```bash
# Generar secret seguro
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### **2. MongoDB Atlas**
- Usar cluster de producción
- Configurar IP whitelist
- Usar usuario con permisos mínimos

### **3. CORS**
```typescript
// Solo dominios permitidos
const allowedOrigins = [
  'https://agrodigital.es',
  'https://www.agrodigital.es'
];
```

### **4. Rate Limiting**
```typescript
// Más restrictivo en producción
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 50, // máximo 50 requests por ventana
});
```

## 📊 **MONITOREO Y LOGS**

### **1. Logs de Producción**
```typescript
// Usar Winston o similar
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### **2. Health Checks**
```typescript
app.get('/health', async (req, res) => {
  try {
    // Verificar MongoDB
    await mongoose.connection.db.admin().ping();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});
```

### **3. Métricas**
```typescript
// Usar Prometheus o similar
import prometheus from 'prom-client';

const httpRequestDurationMicroseconds = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});
```

## 🚨 **BACKUP Y RECUPERACIÓN**

### **1. MongoDB Atlas**
- Backup automático diario
- Backup manual antes de cambios importantes
- Documentar proceso de restauración

### **2. Código**
- Tags de versión en Git
- Branch de producción separado
- Rollback automático en fallos

### **3. Variables de Entorno**
- Documentar todas las variables
- Backup de configuraciones
- Proceso de actualización

## 📈 **ESCALABILIDAD**

### **1. Load Balancing**
```typescript
// Usar PM2 para múltiples instancias
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
} else {
  // Worker process
  app.listen(PORT);
}
```

### **2. Caching**
```typescript
// Redis para cache
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

// Cache de estadísticas del dashboard
app.get('/api/dashboard', async (req, res) => {
  const cacheKey = `dashboard:${req.user.userId}`;
  const cached = await redis.get(cacheKey);
  
  if (cached) {
    return res.json(JSON.parse(cached));
  }
  
  // Calcular estadísticas
  const stats = await calculateDashboardStats(req.user.userId);
  
  // Cache por 5 minutos
  await redis.setex(cacheKey, 300, JSON.stringify(stats));
  
  res.json(stats);
});
```

### **3. CDN**
- Cloudflare para assets estáticos
- Imágenes optimizadas
- Compresión gzip/brotli

## 🔄 **CI/CD PIPELINE**

### **1. GitHub Actions**
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: |
          cd backend && npm install
          cd ../agrodigital-mvp && npm install
          
      - name: Build
        run: |
          cd backend && npm run build
          cd ../agrodigital-mvp && npm run build
          
      - name: Deploy to Railway
        uses: bervProject/railway-deploy@v1.0.0
        with:
          service: agrodigital-api
          
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          working-directory: ./agrodigital-mvp
```

## 📱 **PWA EN PRODUCCIÓN**

### **1. Service Worker**
```typescript
// Cache de recursos estáticos
const CACHE_NAME = 'agrodigital-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});
```

### **2. Manifest**
```json
{
  "name": "AgroDigital",
  "short_name": "AgroDigital",
  "description": "Plataforma agrícola digital",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#16a34a",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

## 🎯 **DOMINIO Y SSL**

### **1. Configuración DNS**
```
A     @     185.199.108.153
A     @     185.199.109.153
A     @     185.199.110.153
A     @     185.199.111.153
CNAME www   agrodigital.es
```

### **2. SSL Certificate**
- Let's Encrypt automático
- Renovación automática
- HSTS headers

## 📊 **ANALYTICS Y MONITOREO**

### **1. Google Analytics**
```typescript
// Tracking de eventos importantes
gtag('event', 'activity_created', {
  'event_category': 'engagement',
  'event_label': 'new_activity'
});
```

### **2. Error Tracking**
```typescript
// Sentry para errores
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

---

**🚀 ¡AgroDigital listo para conquistar el mundo agrícola! 🌱**
