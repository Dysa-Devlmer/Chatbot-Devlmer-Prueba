# Script para reiniciar Next.js con variables de entorno actualizadas
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  REINICIANDO NEXT.JS CON NUEVAS VARIABLES" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Paso 1: Cerrar proceso en puerto 7847
Write-Host "[1/3] Cerrando Next.js actual..." -ForegroundColor Yellow
$connections = netstat -ano | Select-String ":7847.*LISTENING"
if ($connections) {
    $pid = $connections[0].ToString().Split()[-1]
    Write-Host "      Encontrado PID: $pid" -ForegroundColor Gray

    try {
        Stop-Process -Id $pid -Force -ErrorAction Stop
        Write-Host "      Proceso cerrado exitosamente" -ForegroundColor Green
        Start-Sleep -Seconds 3
    } catch {
        Write-Host "      No se pudo cerrar (puede estar en otra consola)" -ForegroundColor Yellow
        Write-Host "      Por favor ve a la ventana de PowerShell de Next.js" -ForegroundColor Yellow
        Write-Host "      y presiona Ctrl+C para cerrarla" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Presiona Enter cuando hayas cerrado el servidor anterior..." -ForegroundColor Cyan
        Read-Host
    }
} else {
    Write-Host "      No hay proceso en puerto 7847" -ForegroundColor Gray
}

# Paso 2: Verificar variables de entorno
Write-Host ""
Write-Host "[2/3] Verificando variables de entorno..." -ForegroundColor Yellow
if (Test-Path ".env") {
    $envContent = Get-Content ".env" | Select-String "WHATSAPP_TOKEN"
    if ($envContent) {
        Write-Host "      Variables encontradas en .env" -ForegroundColor Green
    } else {
        Write-Host "      ERROR: No se encontraron variables WHATSAPP en .env" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "      ERROR: Archivo .env no encontrado" -ForegroundColor Red
    exit 1
}

# Paso 3: Iniciar Next.js
Write-Host ""
Write-Host "[3/3] Iniciando Next.js en puerto 7847..." -ForegroundColor Yellow
Write-Host "      Las variables de entorno ahora se cargaran desde .env" -ForegroundColor Gray
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  NEXT.JS SERVER - PUERTO 7847" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

npm run dev
