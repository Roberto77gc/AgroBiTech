#!/bin/bash

# Script de build para Vercel
echo "🌱 Construyendo AgroDigital Frontend..."

# Verificar variables de entorno
if [ -z "$VITE_API_BASE_URL" ]; then
  echo "⚠️  Advertencia: VITE_API_BASE_URL no está configurada"
  echo "   Usando URL por defecto: https://api.agrodigital.railway.app/api"
  export VITE_API_BASE_URL="https://api.agrodigital.railway.app/api"
fi

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# Ejecutar linting
echo "🔍 Ejecutando linting..."
npm run lint

# Construir la aplicación
echo "🔨 Construyendo aplicación..."
npm run build

# Verificar que el build fue exitoso
if [ -d "dist" ]; then
  echo "✅ Build exitoso en directorio dist/"
  echo "📊 Tamaño del build:"
  du -sh dist/*
else
  echo "❌ Error: El build falló"
  exit 1
fi
