# Script para eliminar los servicios JARVIS que están causando el problema
Write-Host "=== Eliminando servicios JARVIS ===" -ForegroundColor Red

$services = @('JARVIS-Server', 'JARVIS-Ollama', 'JARVIS-Ngrok')

foreach ($serviceName in $services) {
    Write-Host "`nProcesando servicio: $serviceName" -ForegroundColor Yellow

    # Detener el servicio
    try {
        Stop-Service -Name $serviceName -Force -ErrorAction Stop
        Write-Host "  ✓ Servicio detenido" -ForegroundColor Green
    } catch {
        Write-Host "  ! Error al detener: $_" -ForegroundColor Yellow
    }

    # Eliminar el servicio usando sc.exe
    Write-Host "  Eliminando servicio..."
    $result = & sc.exe delete $serviceName 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Servicio eliminado" -ForegroundColor Green
    } else {
        Write-Host "  ! Error: $result" -ForegroundColor Red
    }
}

Write-Host "`n=== Verificando puerto 7847 ===" -ForegroundColor Cyan
Start-Sleep -Seconds 2
$port = Get-NetTCPConnection -LocalPort 7847 -ErrorAction SilentlyContinue
if ($port) {
    Write-Host "Puerto 7847 aún ocupado por PID: $($port.OwningProcess)" -ForegroundColor Red
} else {
    Write-Host "Puerto 7847 está LIBRE ✓" -ForegroundColor Green
}
