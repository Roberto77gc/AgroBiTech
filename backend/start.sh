#!/bin/bash

# Script de inicio para Railway
echo "🌱 Iniciando AgroDigital Backend..."

# Verificar variables de entorno críticas
if [ -z "$MONGODB_URI" ]; then
  echo "❌ Error: MONGODB_URI no está configurada"
  exit 1
fi

if [ -z "$JWT_SECRET" ]; then
  echo "❌ Error: JWT_SECRET no está configurada"
  exit 1
fi

# Instalar dependencias si es necesario
if [ ! -d "node_modules" ]; then
  echo "📦 Instalando dependencias..."
  npm install --production
fi

# Construir la aplicación
echo "🔨 Construyendo aplicación..."
npm run build

# Iniciar la aplicación
echo "🚀 Iniciando servidor..."
npm start
