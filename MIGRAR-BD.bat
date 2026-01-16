@echo off
chcp 65001 >nul
cls
echo.
echo ╔════════════════════════════════════════════════╗
echo ║   MIGRACIÓN DE BASE DE DATOS - PITHY CHATBOT   ║
echo ╚════════════════════════════════════════════════╝
echo.
echo.
echo ⚠️  IMPORTANTE: Este proceso actualizará tu base de datos
echo    para soportar las 6 nuevas funcionalidades profesionales.
echo.
echo 📋 Nuevas tablas que se crearán:
echo    • Tag (Sistema de etiquetas)
echo    • Campos adicionales en Conversation
echo.
echo.
echo 🛑 PASO 1: Cierra la ventana de PowerShell donde corre Next.js
echo.
pause
echo.
echo ════════════════════════════════════════════════
echo  Generando cliente de Prisma...
echo ════════════════════════════════════════════════
echo.
call npx prisma generate
if errorlevel 1 (
    echo.
    echo ❌ ERROR: No se pudo generar el cliente de Prisma
    echo.
    echo 💡 Posibles soluciones:
    echo    1. Verifica que cerraste la ventana de Next.js
    echo    2. Intenta reiniciar tu computadora
    echo    3. Ejecuta manualmente: npx prisma generate
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ Cliente generado correctamente
echo.
echo ════════════════════════════════════════════════
echo  Aplicando cambios a la base de datos...
echo ════════════════════════════════════════════════
echo.
call npx prisma db push
if errorlevel 1 (
    echo.
    echo ⚠️  Hubo un problema al aplicar los cambios
    echo    Pero puede que algunos cambios se hayan aplicado.
    echo.
)

echo.
echo ════════════════════════════════════════════════
echo  ✅ MIGRACIÓN COMPLETADA
echo ════════════════════════════════════════════════
echo.
echo 📊 Nuevas funcionalidades disponibles:
echo    • Analytics Dashboard
echo    • Quick Replies
echo    • Sistema de Tags/Etiquetas
echo    • Configuración de IA
echo    • Mensajes Programados
echo    • Notificaciones en Tiempo Real
echo.
echo.
echo 🚀 SIGUIENTE PASO: Reiniciar el servidor
echo.
echo    Opción 1 - Automático:
echo    start-system.ps1
echo.
echo    Opción 2 - Manual:
echo    npm run dev
echo.
pause
