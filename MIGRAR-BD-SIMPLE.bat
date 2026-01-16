@echo off
chcp 65001 >nul
cls
echo.
echo ================================================
echo   MIGRACION DE BASE DE DATOS - PITHY CHATBOT
echo ================================================
echo.
echo.
echo IMPORTANTE: Este proceso actualizara tu base de datos
echo.
echo.
echo PASO 1: Cerrando servidor Next.js...
echo.

REM Cerrar proceso en puerto 7847
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :7847 ^| findstr LISTENING') do (
    echo Cerrando proceso %%a...
    taskkill /F /PID %%a >nul 2>&1
)

timeout /t 3 >nul

echo.
echo ================================================
echo  Generando cliente de Prisma...
echo ================================================
echo.
call npx prisma generate
if errorlevel 1 (
    echo.
    echo ERROR: No se pudo generar el cliente de Prisma
    echo.
    pause
    exit /b 1
)

echo.
echo OK - Cliente generado correctamente
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
echo Nuevas funcionalidades disponibles:
echo   - Analytics Dashboard
echo   - Quick Replies
echo   - Sistema de Tags/Etiquetas
echo   - Configuracion de IA
echo   - Mensajes Programados
echo   - Notificaciones en Tiempo Real
echo.
echo.
echo SIGUIENTE PASO: Reiniciar el servidor
echo.
echo   npm run dev
echo.
pause
