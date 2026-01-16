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
echo   MIGRACION FORZADA - PITHY CHATBOT
echo ================================================
echo.
echo ADVERTENCIA: Se cerraran TODOS los procesos Node.js
echo.
echo Si tienes otros proyectos Node corriendo, se cerraran tambien.
echo.
echo Presiona CTRL+C para cancelar, o
pause

echo.
echo Cerrando TODOS los procesos Node.js...
echo.
taskkill /F /IM node.exe /T >nul 2>&1

echo Procesos Node cerrados.
echo.
echo Esperando 5 segundos para liberar archivos...
timeout /t 5

echo.
echo ================================================
echo  Generando cliente de Prisma...
echo ================================================
echo.
call npx prisma generate
if errorlevel 1 (
    echo.
    echo ERROR: Aun hay problemas. Intenta reiniciar tu PC.
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
echo  MIGRACION COMPLETADA EXITOSAMENTE
echo ================================================
echo.
echo Nuevas funcionalidades:
echo   - Analytics Dashboard
echo   - Quick Replies
echo   - Tags/Etiquetas
echo   - Configuracion IA
echo   - Mensajes Programados
echo.
echo.
echo IMPORTANTE: Ahora reinicia todo el sistema:
echo.
echo Opcion 1: npm run dev
echo Opcion 2: start-system.ps1
echo.
pause
