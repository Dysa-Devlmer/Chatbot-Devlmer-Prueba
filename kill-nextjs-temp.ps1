# Script para cerrar Next.js en puerto 7847
Write-Host "Cerrando Next.js en puerto 7847..." -ForegroundColor Yellow

# Encontrar proceso en puerto 7847
$connections = netstat -ano | Select-String ":7847.*LISTENING"
if ($connections) {
    $pid = $connections[0].ToString().Split()[-1]
    Write-Host "Encontrado PID: $pid" -ForegroundColor Cyan

    try {
        Stop-Process -Id $pid -Force -ErrorAction Stop
        Write-Host "Proceso cerrado exitosamente" -ForegroundColor Green
    } catch {
        Write-Host "Error cerrando proceso: $_" -ForegroundColor Red
        Write-Host "Intentando con taskkill..." -ForegroundColor Yellow
        taskkill /F /PID $pid
    }
} else {
    Write-Host "No se encontró proceso en puerto 7847" -ForegroundColor Yellow
}

Start-Sleep -Seconds 2
