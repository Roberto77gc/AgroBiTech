# 🌱 AgroDigital - Plataforma Agrícola Digital Moderna

## 📋 Descripción

AgroDigital es una plataforma integral de gestión agrícola moderna diseñada especialmente para pequeños y medianos agricultores. Combina una interfaz intuitiva y responsive con potentes herramientas de análisis para optimizar la gestión de cultivos, inventario y costos.

### ✨ Características Principales

- 🔐 **Autenticación Segura** - Sistema completo de registro e inicio de sesión con JWT
- 📊 **Dashboard Inteligente** - Estadísticas en tiempo real y visualizaciones interactivas
- 📱 **Diseño Responsive** - Optimizado para móviles, tablets y escritorio
- 🌙 **Modo Oscuro/Claro** - Interfaz adaptable a preferencias del usuario
- 📈 **Análisis de Costos** - Seguimiento detallado de gastos por hectárea
- 🔔 **Notificaciones Inteligentes** - Alertas y recomendaciones contextuales
- 🏗️ **Arquitectura Escalable** - Backend TypeScript con MongoDB

## 🚀 Tecnologías

### Frontend
- **React 19** con TypeScript
- **Vite** para desarrollo rápido
- **Tailwind CSS** para diseño moderno
- **Lucide React** para iconografía
- **Recharts** para visualizaciones
- **React Toastify** para notificaciones

### Backend
- **Node.js** con Express y TypeScript
- **MongoDB** con Mongoose
- **JWT** para autenticación
- **Bcrypt** para encriptación
- **CORS, Helmet, Rate Limiting** para seguridad

## 📦 Instalación

### Prerrequisitos
- Node.js 16+
- MongoDB (local o Atlas)
- npm o yarn

### 1. Clonar el Repositorio
```bash
git clone <tu-repositorio>
cd agrodigital
```

### 2. Configurar el Backend
```bash
cd backend
npm install
```

Crear archivo `.env` en la carpeta backend:
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
MONGO_URI=mongodb://localhost:27017/agrodigital

# Authentication
JWT_SECRET=tu-clave-secreta-muy-segura
JWT_EXPIRES_IN=7d

# CORS Configuration
FRONTEND_URL=http://localhost:5173
```

### 3. Configurar el Frontend
```bash
cd ..
npm install
```

Crear archivo `.env` en la raíz del proyecto:
```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3000/api

# App Configuration
VITE_APP_NAME=AgroDigital
VITE_APP_VERSION=1.0.0
```

## 🎯 Ejecutar la Aplicación

### Desarrollo
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend (desde la raíz)
npm start
```

### Producción
```bash
# Backend
cd backend
npm run build
npm start

# Frontend
npm run build
```

## 🌐 URLs de la Aplicación

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **API Health**: http://localhost:3000/api/health
- **API Docs**: http://localhost:3000 (documentación automática)

## 🔗 Endpoints de la API

### Autenticación
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Inicio de sesión
- `GET /api/auth/profile` - Perfil del usuario (requiere token)
- `GET /api/auth/validate` - Validar token

### Dashboard
- `GET /api/dashboard` - Estadísticas del dashboard (requiere token)
- `GET /api/dashboard/activities` - Lista de actividades con paginación

### Utilidades
- `GET /api/health` - Health check de la API

## 🔐 Autenticación

El sistema utiliza JWT (JSON Web Tokens) para la autenticación:

1. **Registro/Login**: El usuario se registra o inicia sesión
2. **Token JWT**: Se genera un token válido por 7 días
3. **Almacenamiento**: Token se guarda en localStorage del navegador
4. **Headers**: Requests autenticados incluyen `Authorization: Bearer <token>`
5. **Validación**: El backend valida el token en cada request protegido

## 📱 Características Responsive

- **Mobile First**: Diseño optimizado para móviles
- **Breakpoints**: sm, md, lg, xl para diferentes pantallas
- **Touch Friendly**: Botones y controles optimizados para touch
- **Navigation**: Menú adaptativo según el tamaño de pantalla

## 🌙 Sistema de Temas

- **Auto-detección**: Respeta preferencias del sistema operativo
- **Persistencia**: Recuerda la elección del usuario
- **Transiciones**: Cambios suaves entre modos
- **Cobertura Completa**: Todos los componentes soportan ambos modos

## 🔒 Seguridad

- **Validación de Entrada**: Express-validator en backend
- **Rate Limiting**: Protección contra ataques de fuerza bruta
- **CORS**: Configuración específica para el frontend
- **Helmet**: Headers de seguridad automáticos
- **Bcrypt**: Hash de contraseñas con salt de 12 rounds

## 📊 Estructura del Proyecto

```
agrodigital/
├── 📁 backend/
│   ├── 📁 src/
│   │   ├── 📁 config/          # Configuración de DB
│   │   ├── 📁 controllers/     # Lógica de negocio
│   │   ├── 📁 middleware/      # Auth, validación, errores
│   │   ├── 📁 models/          # Esquemas de MongoDB
│   │   ├── 📁 routes/          # Rutas de la API
│   │   ├── 📁 types/           # Tipos TypeScript
│   │   └── 📄 index.ts         # Punto de entrada
│   ├── 📄 package.json
│   ├── 📄 tsconfig.json
│   └── 📄 .env
├── 📁 src/
│   ├── 📁 components/          # Componentes React
│   ├── 📁 config/              # Configuración API
│   ├── 📁 hooks/               # Hooks personalizados
│   ├── 📁 services/            # Servicios de API
│   ├── 📄 types.ts
│   └── 📄 App.tsx
├── 📄 package.json
├── 📄 tailwind.config.js
├── 📄 vite.config.js
└── 📄 README.md
```

## 🚨 Solución de Problemas

### Backend no conecta a MongoDB
```bash
# Verificar que MongoDB esté ejecutándose
mongosh
# O iniciar MongoDB
mongod
```

### Frontend no puede conectar al backend
1. Verificar que el backend esté en puerto 3000
2. Revisar CORS en el archivo `.env` del backend
3. Verificar `VITE_API_BASE_URL` en `.env` del frontend

### Errores de autenticación
1. Verificar que `JWT_SECRET` esté configurado
2. Limpiar localStorage del navegador
3. Reiniciar backend después de cambios en `.env`

## 🔧 Desarrollo

### Scripts Disponibles
```bash
# Frontend
npm start          # Desarrollo con Vite
npm run build      # Build para producción
npm run preview    # Preview del build

# Backend
npm run dev        # Desarrollo con nodemon
npm run build      # Compilar TypeScript
npm start          # Ejecutar versión compilada
npm run lint       # Linter de código
```

### Contribuir
1. Fork del repositorio
2. Crear rama feature: `git checkout -b feature/nueva-funcionalidad`
3. Commit cambios: `git commit -m 'Add nueva funcionalidad'`
4. Push a la rama: `git push origin feature/nueva-funcionalidad`
5. Crear Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE.md](LICENSE.md) para detalles.

## 👥 Soporte

Para soporte y preguntas:
- 📧 Email: soporte@agrodigital.com
- 📱 WhatsApp: +XX XXX XXX XXX
- 🌐 Web: www.agrodigital.com

---

**Desarrollado con 💚 para agricultores por agricultores** 🌱
