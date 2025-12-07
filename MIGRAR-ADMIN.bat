@echo off
:: Verificar permisos de administrador
net session >nul 2>&1
if %errorLevel% == 0 (
    goto :admin
) else (
    echo Solicitando permisos de administrador...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

:admin
cd /d E:\prueba
cls
echo.
echo ================================================
echo   MIGRACION DE BASE DE DATOS - PITHY CHATBOT
echo ================================================
echo.
echo Ejecutando con permisos de administrador...
echo.
echo PASO 1: Cerrando servidor Next.js...
echo.

REM Cerrar todos los procesos en puerto 7847
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :7847 ^| findstr LISTENING') do (
    echo Cerrando proceso %%a...
    taskkill /F /PID %%a
)

timeout /t 3

echo.
echo ================================================
echo  Generando cliente de Prisma...
echo ================================================
echo.
call npx prisma generate
if errorlevel 1 (
    echo.
    echo ERROR: No se pudo generar el cliente
    echo.
    pause
    exit /b 1
)

echo.
echo OK - Cliente generado
echo.
echo ================================================
echo  Aplicando cambios a la base de datos...
echo ================================================
echo.
call npx prisma db push

echo.
echo ================================================
echo  MIGRACION COMPLETADA
echo ================================================
echo.
echo Funcionalidades disponibles:
echo   - Analytics Dashboard
echo   - Quick Replies
echo   - Tags/Etiquetas
echo   - Configuracion IA
echo   - Mensajes Programados
echo.
echo Ahora reinicia el servidor con: npm run dev
echo.
pause
