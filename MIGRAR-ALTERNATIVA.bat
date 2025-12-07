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
echo   MIGRACION ALTERNATIVA - PITHY CHATBOT
echo ================================================
echo.
echo Este metodo eliminara el archivo bloqueado de Prisma
echo y lo regenerara desde cero (sin cerrar Node globalmente)
echo.
pause

echo.
echo Eliminando archivo bloqueado...
echo.
del /F /Q "node_modules\.prisma\client\query_engine-windows.dll.node" >nul 2>&1
echo Archivo eliminado (si existia)
echo.
timeout /t 2

echo.
echo ================================================
echo  Generando cliente de Prisma...
echo ================================================
echo.
call npx prisma generate
if errorlevel 1 (
    echo.
    echo ERROR: Fallo al generar cliente
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
echo Funcionalidades disponibles:
echo   - Analytics Dashboard
echo   - Quick Replies
echo   - Tags/Etiquetas
echo   - Configuracion IA
echo   - Mensajes Programados
echo.
echo Reinicia el servidor: npm run dev
echo.
pause
