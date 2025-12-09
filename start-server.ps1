# Script para reiniciar el servidor Next.js
# Uso: Click derecho -> Ejecutar con PowerShell (como administrador)
# O desde terminal: pwsh -ExecutionPolicy Bypass -File start-server.ps1

Set-Location "E:\prueba"

Write-Host "🔄 Buscando proceso en puerto 7847..." -ForegroundColor Yellow

$processId = (Get-NetTCPConnection -LocalPort 7847 -ErrorAction SilentlyContinue | Select-Object -First 1).OwningProcess

if ($processId) {
    Write-Host "⚠️ Cerrando proceso PID: $processId" -ForegroundColor Red
    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
} else {
    Write-Host "✅ Puerto 7847 libre" -ForegroundColor Green
}

Write-Host "🚀 Iniciando servidor Next.js..." -ForegroundColor Cyan
npm run dev
