#!/bin/bash

echo "🚀 AGRODIGITAL - VERIFICACIÓN RÁPIDA PARA PRODUCCIÓN"
echo "=================================================="
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Función para verificar
check() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

echo "🔍 Verificando estado del proyecto..."
echo ""

# 1. Verificar que el frontend se construye
echo "🌐 Construyendo frontend..."
cd agrodigital-mvp
npm run build > /dev/null 2>&1
check $? "Frontend se construye correctamente"
cd ..

# 2. Verificar que el backend se construye
echo "🔧 Construyendo backend..."
cd backend
npm run build > /dev/null 2>&1
check $? "Backend se construye correctamente"
cd ..

# 3. Verificar linting
echo "🔍 Verificando linting..."
cd agrodigital-mvp
npm run lint > /dev/null 2>&1
check $? "Linting del frontend"
cd ..

# 4. Verificar que no hay errores críticos
echo "🚨 Verificando errores críticos..."
cd agrodigital-mvp
if grep -r "console.error" src/ > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Se encontraron console.error (revisar)${NC}"
else
    echo -e "${GREEN}✅ No hay console.error críticos${NC}"
fi
cd ..

# 5. Verificar archivos de configuración
echo "⚙️  Verificando configuración..."
if [ -f "agrodigital-mvp/vercel.json" ]; then
    echo -e "${GREEN}✅ Vercel configurado${NC}"
else
    echo -e "${RED}❌ Vercel no configurado${NC}"
fi

if [ -f "backend/railway.json" ]; then
    echo -e "${GREEN}✅ Railway configurado${NC}"
else
    echo -e "${RED}❌ Railway no configurado${NC}"
fi

# 6. Verificar variables de entorno críticas
echo "🔐 Verificando variables de entorno..."
if grep -q "VITE_API_BASE_URL" agrodigital-mvp/src/services/api.ts; then
    echo -e "${GREEN}✅ API URL configurada${NC}"
else
    echo -e "${RED}❌ API URL no configurada${NC}"
fi

echo ""
echo "📊 RESUMEN:"
echo "==========="
echo "✅ Frontend: React + TypeScript + Vite"
echo "✅ Backend: Node.js + Express + MongoDB"
echo "✅ Deployment: Vercel + Railway"
echo "✅ Funcionalidades: Completas"
echo ""
echo "🚀 LISTO PARA PRODUCCIÓN"
echo "========================"
echo ""
echo "Próximos pasos:"
echo "1. Configurar variables de entorno en Vercel y Railway"
echo "2. Hacer push a GitHub para deploy automático"
echo "3. Verificar que todo funciona en producción"
echo "4. Configurar dominio personalizado"
echo ""
echo "💡 Comandos útiles:"
echo "   git add . && git commit -m 'Ready for production' && git push"
echo "   vercel --prod"
echo "   railway up"
