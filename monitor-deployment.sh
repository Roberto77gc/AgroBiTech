#!/bin/bash

echo "📊 AGRODIGITAL - MONITOR DE DEPLOYMENTS"
echo "======================================="
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# URLs (configura estas con tus URLs reales)
FRONTEND_URL="https://tu-frontend.vercel.app"
BACKEND_URL="https://tu-backend.railway.app"

# Función para verificar endpoint
check_endpoint() {
    local url=$1
    local name=$2
    local expected_status=${3:-200}
    
    echo -n "Verificando $name... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$response" -eq "$expected_status" ]; then
        echo -e "${GREEN}✅ OK${NC}"
        return 0
    else
        echo -e "${RED}❌ Error (HTTP $response)${NC}"
        return 1
    fi
}

# Función para verificar tiempo de respuesta
check_response_time() {
    local url=$1
    local name=$2
    local max_time=${3:-5}
    
    echo -n "Verificando tiempo de respuesta de $name... "
    
    response_time=$(curl -s -w "%{time_total}" -o /dev/null "$url")
    
    if (( $(echo "$response_time < $max_time" | bc -l) )); then
        echo -e "${GREEN}✅ ${response_time}s${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  ${response_time}s (lento)${NC}"
        return 1
    fi
}

echo "🔍 Verificando deployments automáticos..."
echo ""

# Verificar frontend
echo "🌐 FRONTEND (Vercel)"
echo "-------------------"
check_endpoint "$FRONTEND_URL" "Página principal"
check_response_time "$FRONTEND_URL" "Frontend" 3

# Verificar backend
echo ""
echo "🔧 BACKEND (Railway)"
echo "-------------------"
check_endpoint "$BACKEND_URL/api/health" "Health check"
check_endpoint "$BACKEND_URL/api/auth/check" "Auth endpoint"
check_response_time "$BACKEND_URL/api/health" "Backend" 2

# Verificar conectividad
echo ""
echo "🔗 CONECTIVIDAD"
echo "---------------"
echo -n "Verificando conectividad frontend-backend... "
if curl -s "$FRONTEND_URL" | grep -q "$BACKEND_URL"; then
    echo -e "${GREEN}✅ Configurado${NC}"
else
    echo -e "${YELLOW}⚠️  Verificar configuración${NC}"
fi

# Verificar PWA
echo ""
echo "📱 PWA"
echo "-----"
check_endpoint "$FRONTEND_URL/manifest.json" "Manifest"
check_endpoint "$FRONTEND_URL/sw.js" "Service Worker"

# Verificar HTTPS
echo ""
echo "🔒 SEGURIDAD"
echo "------------"
echo -n "Verificando HTTPS... "
if [[ "$FRONTEND_URL" == https://* ]] && [[ "$BACKEND_URL" == https://* ]]; then
    echo -e "${GREEN}✅ Configurado${NC}"
else
    echo -e "${RED}❌ No configurado${NC}"
fi

# Resumen
echo ""
echo "📊 RESUMEN"
echo "=========="
echo "Frontend: $FRONTEND_URL"
echo "Backend: $BACKEND_URL"
echo "Health: $BACKEND_URL/api/health"
echo ""

# Verificar si hay errores recientes
echo "🔍 Verificando logs recientes..."
echo ""

# Railway logs (si tienes Railway CLI instalado)
if command -v railway &> /dev/null; then
    echo "📋 Logs recientes de Railway:"
    railway logs --tail 10 2>/dev/null || echo "No se pudieron obtener logs de Railway"
    echo ""
fi

# Vercel logs (si tienes Vercel CLI instalado)
if command -v vercel &> /dev/null; then
    echo "📋 Logs recientes de Vercel:"
    vercel logs --tail 10 2>/dev/null || echo "No se pudieron obtener logs de Vercel"
    echo ""
fi

echo "✅ Monitoreo completado"
echo ""
echo "💡 Para monitoreo continuo, ejecuta:"
echo "   watch -n 30 ./monitor-deployment.sh"
