# 🛠️ Configuración del Entorno de Desarrollo - AgroDigital

## 📋 **PASOS PARA CONFIGURAR EL PROYECTO**

### **1. Verificar Node.js**
```bash
node --version  # Debe ser 18+
npm --version   # Debe ser 9+
```

### **2. Configurar MongoDB Atlas**
1. Ir a [MongoDB Atlas](https://cloud.mongodb.com)
2. Crear cuenta gratuita
3. Crear cluster (gratuito)
4. Obtener URI de conexión
5. Crear usuario de base de datos

### **3. Configurar Variables de Entorno**

#### **Backend (.env)**
```bash
cd backend
# Crear archivo .env
PORT=3000
NODE_ENV=development
JWT_SECRET=tu_secreto_super_seguro_aqui
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/agrodigital
```

#### **Frontend (.env)**
```bash
cd agrodigital-mvp
# Crear archivo .env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_NAME=AgroDigital
VITE_APP_VERSION=1.0.0
```

### **4. Instalar Dependencias**

#### **Backend**
```bash
cd backend
npm install
npm run build
```

#### **Frontend**
```bash
cd agrodigital-mvp
npm install
```

### **5. Iniciar Servicios**

#### **Opción A: Scripts Automáticos**
```bash
# Windows
start-dev.bat

# Linux/Mac
./start-dev.sh
```

#### **Opción B: Manual**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd agrodigital-mvp
npm run dev
```

## 🔍 **VERIFICACIÓN DE INSTALACIÓN**

### **Backend (puerto 3000)**
- ✅ Servidor iniciado
- ✅ MongoDB conectado
- ✅ Health check: http://localhost:3000/api/health

### **Frontend (puerto 5173)**
- ✅ Vite iniciado
- ✅ React cargado
- ✅ Conexión con backend

## 🚨 **PROBLEMAS COMUNES Y SOLUCIONES**

### **Error: Puerto 3000 en uso**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3000
kill -9 <PID>
```

### **Error: MongoDB no conecta**
```bash
# Verificar URI
# Verificar credenciales
# Verificar IP whitelist en Atlas
```

### **Error: Módulos no encontrados**
```bash
# Limpiar node_modules
rm -rf node_modules
npm install
```

### **Error: TypeScript compilation**
```bash
# Verificar tsconfig.json
# Verificar tipos
npm run build
```

## 📱 **TESTING DE FUNCIONALIDADES**

### **1. Registro de Usuario**
- Ir a http://localhost:5173
- Click en "Registrarse"
- Completar formulario
- Verificar en MongoDB

### **2. Login**
- Usar credenciales del registro
- Verificar token JWT
- Verificar redirección al dashboard

### **3. Crear Actividad**
- Click en "+ Nueva Actividad"
- Completar formulario
- Verificar en dashboard
- Verificar en MongoDB

### **4. Dashboard**
- Verificar estadísticas
- Verificar lista de actividades
- Verificar filtros y búsqueda

## 🔧 **CONFIGURACIÓN AVANZADA**

### **Development con Hot Reload**
```bash
# Backend
npm run watch

# Frontend
npm run dev
```

### **Build de Producción**
```bash
# Backend
npm run build
npm start

# Frontend
npm run build
npm run preview
```

### **Linting y Formateo**
```bash
# Backend
npm run lint

# Frontend
npm run lint
```

## 📊 **MONITOREO Y DEBUGGING**

### **Logs del Backend**
```bash
# Ver logs en tiempo real
tail -f backend/logs/app.log
```

### **DevTools del Frontend**
- F12 en el navegador
- Console para logs
- Network para requests API
- Application para localStorage

### **MongoDB Compass**
- Conectar a URI de Atlas
- Explorar colecciones
- Verificar datos

## 🚀 **DEPLOYMENT**

### **Backend (Railway/Heroku)**
```bash
npm run build
# Subir dist/ a plataforma
```

### **Frontend (Vercel/Netlify)**
```bash
npm run build
# Subir dist/ a plataforma
```

## 📚 **RECURSOS ADICIONALES**

- [Documentación MongoDB](https://docs.mongodb.com/)
- [Express.js Guide](https://expressjs.com/en/guide/)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**✅ Si todo está funcionando, ¡estás listo para desarrollar AgroDigital! 🎉**
