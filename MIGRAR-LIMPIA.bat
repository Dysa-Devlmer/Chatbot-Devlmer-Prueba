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
echo   MIGRACION LIMPIA - PITHY CHATBOT
echo ================================================
echo.
echo Este metodo eliminara TODA la carpeta .prisma
echo y la regenerara completamente desde cero
echo.
pause

echo.
echo Eliminando carpeta .prisma completa...
echo.
rmdir /S /Q "node_modules\.prisma" >nul 2>&1
if exist "node_modules\.prisma" (
    echo Intentando con PowerShell...
    powershell -Command "Remove-Item -Path 'node_modules\.prisma' -Recurse -Force -ErrorAction SilentlyContinue"
)
echo Carpeta eliminada
echo.
timeout /t 2

echo.
echo ================================================
echo  Generando cliente de Prisma (desde cero)...
echo ================================================
echo.
call npx prisma generate
if errorlevel 1 (
    echo.
    echo ERROR: Aun fallo. El problema puede ser mas profundo.
    echo.
    echo Solucion: Reinicia tu PC y luego ejecuta este script.
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
echo Funcionalidades disponibles:
echo   - Analytics Dashboard
echo   - Quick Replies
echo   - Tags/Etiquetas
echo   - Configuracion IA
echo   - Mensajes Programados
echo.
echo.
echo Reinicia el servidor: npm run dev
echo.
pause
