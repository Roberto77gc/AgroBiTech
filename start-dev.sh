#!/bin/bash

echo "🌱 Iniciando AgroDigital en modo desarrollo..."
echo

echo "📡 Iniciando Backend (puerto 3000)..."
cd backend
gnome-terminal --title="AgroDigital Backend" -- bash -c "npm run dev; exec bash" &
cd ..

echo
echo "⏳ Esperando 3 segundos para que el backend se inicie..."
sleep 3

echo "🌐 Iniciando Frontend (puerto 5173)..."
cd agrodigital-mvp
gnome-terminal --title="AgroDigital Frontend" -- bash -c "npm run dev; exec bash" &
cd ..

echo
echo "✅ AgroDigital iniciado correctamente!"
echo "📡 Backend: http://localhost:3000"
echo "🌐 Frontend: http://localhost:5173"
echo
echo "Presiona Enter para cerrar esta ventana..."
read
