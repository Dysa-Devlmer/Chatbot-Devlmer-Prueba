@echo off
REM ========================================
REM PITHY CHATBOT - Inicio automatico
REM ========================================

title PITHY Chatbot - Sistema de inicio

echo.
echo ========================================
echo   PITHY CHATBOT - INICIO AUTOMATICO
echo ========================================
echo.

REM Verificar si ngrok.exe existe
if not exist "E:\prueba\ngrok.exe" (
    echo [ERROR] ngrok.exe NO ENCONTRADO
    echo.
    echo Es posible que 360 Total Security lo haya eliminado.
    echo.
    echo SOLUCION:
    echo   1. Restaura ngrok desde Git: git checkout HEAD -- ngrok.exe
    echo   2. Agrega ngrok a la lista de confianza de 360 Total Security
    echo   3. Lee: CONFIGURAR-360-SECURITY.md
    echo.
    pause
    exit /b 1
)

echo [OK] ngrok.exe detectado
echo.

REM Verificar si 360 Total Security está activo
tasklist /FI "IMAGENAME eq 360Tray.exe" 2>NUL | find /I /N "360Tray.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo [ADVERTENCIA] 360 Total Security esta activo
    echo.
    echo Asegurate de haber agregado ngrok.exe a la lista de confianza.
    echo Si no lo has hecho, lee: CONFIGURAR-360-SECURITY.md
    echo.
    timeout /t 3 >nul
)

echo Deteniendo procesos anteriores...
pm2 delete all >nul 2>&1

echo.
echo Iniciando sistema completo con PM2...
pm2 start ecosystem.config.js

echo.
echo Esperando que los servicios inicien (15 segundos)...
timeout /t 15 /nobreak >nul

echo.
echo ========================================
echo   ESTADO DEL SISTEMA
echo ========================================
echo.
pm2 list

echo.
echo ========================================
echo   OBTENIENDO URL DE NGROK
echo ========================================
echo.

"C:\Program Files\PowerShell\7\pwsh.exe" -NoProfile -Command "$url = try { (Invoke-RestMethod -Uri 'http://localhost:4040/api/tunnels' -ErrorAction Stop).tunnels.public_url } catch { $null }; if ($url) { Write-Host ''; Write-Host 'Webhook URL:' -ForegroundColor Green; Write-Host \"$url/api/whatsapp/webhook\" -ForegroundColor Cyan; Write-Host ''; Write-Host 'Dashboard Next.js:' -ForegroundColor Green; Write-Host 'http://localhost:7847' -ForegroundColor Cyan; Write-Host ''; Write-Host 'Ngrok Dashboard:' -ForegroundColor Green; Write-Host 'http://localhost:4040' -ForegroundColor Cyan } else { Write-Host ''; Write-Host '[ERROR] Ngrok no pudo conectarse' -ForegroundColor Red; Write-Host ''; Write-Host 'Posibles causas:' -ForegroundColor Yellow; Write-Host '  1. 360 Total Security bloqueo ngrok' -ForegroundColor White; Write-Host '  2. Ngrok.exe fue eliminado' -ForegroundColor White; Write-Host '  3. Sin conexion a Internet' -ForegroundColor White; Write-Host ''; Write-Host 'Verifica con: pm2 logs ngrok-tunnel' -ForegroundColor Cyan }"

echo.
echo ========================================
echo.
echo Sistema iniciado. Presiona cualquier tecla para salir...
echo (Los servicios seguiran corriendo en segundo plano)
echo.
pause >nul

REM Guardar configuracion de PM2
pm2 save >nul 2>&1
