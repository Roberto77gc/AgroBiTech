#!/bin/bash

echo "🚀 AGRODIGITAL - SCRIPT DE DEPLOYMENT AUTOMATIZADO"
echo "=================================================="
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para mostrar mensajes
show_message() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

show_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

show_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

show_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    show_error "No se encontró package.json. Ejecuta este script desde la raíz del proyecto."
    exit 1
fi

# Verificar que Node.js está instalado
if ! command -v node &> /dev/null; then
    show_error "Node.js no está instalado. Instálalo desde https://nodejs.org/"
    exit 1
fi

# Verificar que npm está instalado
if ! command -v npm &> /dev/null; then
    show_error "npm no está instalado. Instálalo junto con Node.js"
    exit 1
fi

show_message "Verificando dependencias..."

# Verificar que Railway CLI está instalado
if ! command -v railway &> /dev/null; then
    show_warning "Railway CLI no está instalado. Instalando..."
    npm install -g @railway/cli
fi

# Verificar que Vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
    show_warning "Vercel CLI no está instalado. Instalando..."
    npm install -g vercel
fi

show_message "Iniciando deployment..."

# 1. DEPLOY BACKEND A RAILWAY
show_message "🚀 Desplegando backend a Railway..."
cd backend

# Verificar que el backend se construye correctamente
show_message "Construyendo backend..."
npm run build
if [ $? -ne 0 ]; then
    show_error "Error al construir el backend"
    exit 1
fi

# Login a Railway (si no está logueado)
show_message "Verificando login en Railway..."
railway whoami > /dev/null 2>&1
if [ $? -ne 0 ]; then
    show_message "Iniciando sesión en Railway..."
    railway login
fi

# Deploy a Railway
show_message "Desplegando a Railway..."
railway up --detach
if [ $? -eq 0 ]; then
    show_success "Backend desplegado exitosamente en Railway"
    BACKEND_URL=$(railway domain)
    show_message "URL del backend: https://$BACKEND_URL"
else
    show_error "Error al desplegar el backend"
    exit 1
fi

cd ..

# 2. DEPLOY FRONTEND A VERCEL
show_message "🌐 Desplegando frontend a Vercel..."
cd agrodigital-mvp

# Configurar variables de entorno para el build
export VITE_API_BASE_URL="https://$BACKEND_URL/api"

# Verificar que el frontend se construye correctamente
show_message "Construyendo frontend..."
npm run build
if [ $? -ne 0 ]; then
    show_error "Error al construir el frontend"
    exit 1
fi

# Login a Vercel (si no está logueado)
show_message "Verificando login en Vercel..."
vercel whoami > /dev/null 2>&1
if [ $? -ne 0 ]; then
    show_message "Iniciando sesión en Vercel..."
    vercel login
fi

# Deploy a Vercel
show_message "Desplegando a Vercel..."
vercel --prod
if [ $? -eq 0 ]; then
    show_success "Frontend desplegado exitosamente en Vercel"
    FRONTEND_URL=$(vercel ls | grep agrodigital | head -1 | awk '{print $2}')
    show_message "URL del frontend: https://$FRONTEND_URL"
else
    show_error "Error al desplegar el frontend"
    exit 1
fi

cd ..

# 3. CONFIGURAR VARIABLES DE ENTORNO
show_message "⚙️  Configurando variables de entorno..."

# Configurar variables en Railway
show_message "Configurando variables en Railway..."
railway variables set CORS_ORIGINS="https://$FRONTEND_URL,https://www.$FRONTEND_URL"
railway variables set FRONTEND_URL="https://$FRONTEND_URL"

# Configurar variables en Vercel
show_message "Configurando variables en Vercel..."
vercel env add VITE_API_BASE_URL production
vercel env add VITE_FRONTEND_URL production

# 4. VERIFICAR DEPLOYMENT
show_message "🔍 Verificando deployment..."

# Verificar backend
show_message "Verificando backend..."
curl -s "https://$BACKEND_URL/api/health" > /dev/null
if [ $? -eq 0 ]; then
    show_success "Backend funcionando correctamente"
else
    show_warning "Backend no responde. Verifica la configuración."
fi

# Verificar frontend
show_message "Verificando frontend..."
curl -s "https://$FRONTEND_URL" > /dev/null
if [ $? -eq 0 ]; then
    show_success "Frontend funcionando correctamente"
else
    show_warning "Frontend no responde. Verifica la configuración."
fi

# 5. RESUMEN FINAL
echo ""
echo "🎉 DEPLOYMENT COMPLETADO"
echo "========================"
echo ""
echo "🌐 Frontend: https://$FRONTEND_URL"
echo "🔧 Backend:  https://$BACKEND_URL"
echo "📊 Health:   https://$BACKEND_URL/api/health"
echo ""
echo "📝 Próximos pasos:"
echo "1. Configura las variables de entorno en Railway y Vercel"
echo "2. Configura tu dominio personalizado"
echo "3. Configura MongoDB Atlas"
echo "4. Prueba todas las funcionalidades"
echo ""
show_success "¡AgroDigital está desplegado y funcionando!"
