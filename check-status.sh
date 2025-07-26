#!/bin/bash

echo "🌱 AgroDigital - Estado de la Aplicación"
echo "========================================"
echo ""

# Verificar si el backend está corriendo
echo "🔧 Verificando Backend (Puerto 3000)..."
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ Backend está funcionando"
    echo "📊 Health Check:"
    curl -s http://localhost:3000/api/health | head -5
else
    echo "❌ Backend no está respondiendo"
    echo "💡 Para iniciar el backend:"
    echo "   cd backend && npm run dev"
fi

echo ""
echo "🌐 Verificando Frontend (Puerto 5173)..."
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "✅ Frontend está funcionando"
    echo "🔗 URL: http://localhost:5173"
else
    echo "❌ Frontend no está respondiendo"
    echo "💡 Para iniciar el frontend:"
    echo "   npm start"
fi

echo ""
echo "📝 URLs Principales:"
echo "   Frontend: http://localhost:5173"
echo "   Backend API: http://localhost:3000"
echo "   API Health: http://localhost:3000/api/health"
echo "   API Docs: http://localhost:3000"

echo ""
echo "🚀 Comandos para iniciar:"
echo "   Backend:  cd backend && npm run dev"
echo "   Frontend: npm start"

echo ""
echo "📋 Estructura del proyecto:"
tree -I 'node_modules|dist|.git' -L 2 2>/dev/null || echo "   (tree no disponible)"