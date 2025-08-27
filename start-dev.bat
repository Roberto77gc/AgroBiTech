@echo off
echo 🌱 Iniciando AgroDigital en modo desarrollo...
echo.

echo 📡 Iniciando Backend (puerto 3000)...
cd backend
start "AgroDigital Backend" cmd /k "npm run dev"
cd ..

echo.
echo ⏳ Esperando 3 segundos para que el backend se inicie...
timeout /t 3 /nobreak > nul

echo 🌐 Iniciando Frontend (puerto 5173)...
cd agrodigital-mvp
start "AgroDigital Frontend" cmd /k "npm run dev"
cd ..

echo.
echo ✅ AgroDigital iniciado correctamente!
echo 📡 Backend: http://localhost:3000
echo 🌐 Frontend: http://localhost:5173
echo.
echo Presiona cualquier tecla para cerrar esta ventana...
pause > nul
