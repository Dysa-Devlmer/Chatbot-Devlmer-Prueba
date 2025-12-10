# Script para reiniciar el servidor Next.js
# Compatible con Windows 10/11 (PowerShell 5.1+)
# Uso: Click derecho -> Ejecutar con PowerShell (como administrador)
# O desde terminal: powershell -ExecutionPolicy Bypass -File start-server.ps1

# Obtener directorio del script (funciona en cualquier ubicacion)
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PITHY Chatbot - Iniciador de Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Directorio: $ScriptDir" -ForegroundColor Gray
Write-Host ""

# Buscar proceso en puerto 7847
Write-Host "[1/3] Buscando proceso en puerto 7847..." -ForegroundColor Yellow

try {
    $connection = Get-NetTCPConnection -LocalPort 7847 -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($connection) {
        $processId = $connection.OwningProcess
        $processName = (Get-Process -Id $processId -ErrorAction SilentlyContinue).ProcessName

        Write-Host "  ! Encontrado: $processName (PID: $processId)" -ForegroundColor Red
        Write-Host "[2/3] Cerrando proceso..." -ForegroundColor Yellow

        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2

        Write-Host "  OK Proceso cerrado" -ForegroundColor Green
    } else {
        Write-Host "  OK Puerto 7847 libre" -ForegroundColor Green
    }
} catch {
    Write-Host "  OK Puerto 7847 libre" -ForegroundColor Green
}

Write-Host ""
Write-Host "[3/3] Iniciando servidor Next.js..." -ForegroundColor Yellow
Write-Host ""
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""

# Verificar que npm existe
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: npm no encontrado. Instala Node.js primero." -ForegroundColor Red
    Write-Host "Descarga: https://nodejs.org/" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Presiona cualquier tecla para salir..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

# Iniciar servidor
npm run dev
