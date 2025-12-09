@echo off
:: Script para reiniciar el servidor Next.js en puerto 7847
:: Ejecuta PowerShell 7 como administrador y mantiene la ventana abierta

:: Verificar si ya es administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Solicitando permisos de administrador...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

:: Cambiar al directorio del proyecto
cd /d E:\prueba

:: Ejecutar PowerShell 7 con el comando completo
pwsh -NoExit -Command "& {
    Write-Host '🔄 Buscando proceso en puerto 7847...' -ForegroundColor Yellow

    $connection = Get-NetTCPConnection -LocalPort 7847 -ErrorAction SilentlyContinue | Select-Object -First 1

    if ($connection) {
        $pid = $connection.OwningProcess
        Write-Host \"⚠️ Cerrando proceso PID: $pid\" -ForegroundColor Red
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
    } else {
        Write-Host '✅ Puerto 7847 libre' -ForegroundColor Green
    }

    Write-Host '🚀 Iniciando servidor Next.js...' -ForegroundColor Cyan
    npm run dev
}"
