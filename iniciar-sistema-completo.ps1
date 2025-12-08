# ============================================
# Script Profesional de Inicio - PITHY Chatbot
# ============================================
# Este script inicia todos los servicios necesarios de manera automática

Write-Host ""
Write-Host "╔════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     🤖 PITHY CHATBOT - Sistema de Inicio      ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Verificar directorio
if ((Get-Location).Path -ne "E:\prueba") {
    Set-Location "E:\prueba"
    Write-Host "📂 Directorio: E:\prueba" -ForegroundColor Gray
}

# Crear carpeta de logs
if (-not (Test-Path "logs")) {
    New-Item -ItemType Directory -Path "logs" -Force | Out-Null
}

# ============================================
# PASO 1: Verificar servicios existentes
# ============================================
Write-Host "🔍 Verificando servicios existentes..." -ForegroundColor Yellow
Write-Host ""

# Verificar Ollama
$ollamaRunning = Get-Process -Name "ollama" -ErrorAction SilentlyContinue
if ($ollamaRunning) {
    Write-Host "  ✓ Ollama ya está corriendo" -ForegroundColor Green
} else {
    Write-Host "  ⚠ Ollama no detectado - Iniciando..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '🤖 Ollama AI Server' -ForegroundColor Green; ollama serve"
    Start-Sleep -Seconds 5
}

# Verificar Next.js
$nextRunning = netstat -ano | Select-String ":7847" | Select-Object -First 1
if ($nextRunning) {
    Write-Host "  ✓ Next.js ya está corriendo en puerto 7847" -ForegroundColor Green
} else {
    Write-Host "  ⚠ Next.js no detectado - Iniciando..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '⚡ Next.js Server - Puerto 7847' -ForegroundColor Green; npm run dev"
    Start-Sleep -Seconds 12
}

# ============================================
# PASO 2: Iniciar/Reiniciar Ngrok
# ============================================
Write-Host ""
Write-Host "🌐 Configurando túnel ngrok..." -ForegroundColor Yellow

# Detener ngrok anterior si existe
$ngrokProcess = Get-Process -Name "ngrok" -ErrorAction SilentlyContinue
if ($ngrokProcess) {
    Write-Host "  ⏹ Deteniendo ngrok anterior..." -ForegroundColor Gray
    try {
        Stop-Process -Name "ngrok" -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 3
    } catch {
        Write-Host "  ⚠ No se pudo detener ngrok anterior (puede requerir permisos)" -ForegroundColor Yellow
    }
}

# Iniciar ngrok
Write-Host "  🚀 Iniciando ngrok en puerto 7847..." -ForegroundColor Cyan
Start-Process -FilePath ".\ngrok.exe" -ArgumentList "http", "7847"

Write-Host "  ⏳ Esperando conexión de ngrok..." -ForegroundColor Gray
Start-Sleep -Seconds 8

# ============================================
# PASO 3: Obtener URL del Webhook
# ============================================
Write-Host ""
Write-Host "📡 Obteniendo URL pública..." -ForegroundColor Yellow

$maxRetries = 5
$retryCount = 0
$webhookUrl = $null

while ($retryCount -lt $maxRetries -and -not $webhookUrl) {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -ErrorAction Stop
        $publicUrl = $response.tunnels | Where-Object { $_.proto -eq 'https' } | Select-Object -ExpandProperty public_url -First 1

        if (-not $publicUrl -and $response.tunnels.Count -gt 0) {
            $publicUrl = $response.tunnels[0].public_url
        }

        if ($publicUrl) {
            $webhookUrl = "$publicUrl/api/whatsapp/webhook"
            break
        }
    } catch {
        $retryCount++
        if ($retryCount -lt $maxRetries) {
            Write-Host "  ⏳ Reintento $retryCount/$maxRetries..." -ForegroundColor Gray
            Start-Sleep -Seconds 3
        }
    }
}

Write-Host ""
Write-Host ""

if ($webhookUrl) {
    # ============================================
    # ÉXITO - Mostrar información
    # ============================================
    Write-Host "╔════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║            ✅ SISTEMA INICIADO                 ║" -ForegroundColor Green
    Write-Host "╚════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    Write-Host "┌────────────────────────────────────────────────┐" -ForegroundColor Cyan
    Write-Host "│  🌐 WEBHOOK CONFIGURATION                      │" -ForegroundColor White
    Write-Host "└────────────────────────────────────────────────┘" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  📍 Callback URL:" -ForegroundColor Yellow
    Write-Host "     $webhookUrl" -ForegroundColor White
    Write-Host ""
    Write-Host "  🔑 Verify Token:" -ForegroundColor Yellow
    Write-Host "     mi_token_secreto_123" -ForegroundColor White
    Write-Host ""
    Write-Host "┌────────────────────────────────────────────────┐" -ForegroundColor Cyan
    Write-Host "│  🔗 ENLACES ÚTILES                             │" -ForegroundColor White
    Write-Host "└────────────────────────────────────────────────┘" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  📊 Panel Admin:    http://localhost:7847/admin" -ForegroundColor Gray
    Write-Host "  🌐 Panel Ngrok:    http://localhost:4040" -ForegroundColor Gray
    Write-Host "  📱 Meta Console:   https://developers.facebook.com/apps" -ForegroundColor Gray
    Write-Host ""
    Write-Host "┌────────────────────────────────────────────────┐" -ForegroundColor Cyan
    Write-Host "│  ⚙️  CONFIGURACIÓN                             │" -ForegroundColor White
    Write-Host "└────────────────────────────────────────────────┘" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  📅 Horarios:       config-horarios.json" -ForegroundColor Gray
    Write-Host "  📝 Variables:      .env.local" -ForegroundColor Gray
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║  💡 Sistema listo para recibir mensajes       ║" -ForegroundColor Green
    Write-Host "╚════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""

    # Guardar URL en archivo para referencia
    $webhookUrl | Out-File -FilePath ".\logs\last-webhook-url.txt" -Force

} else {
    # ============================================
    # ERROR - No se pudo obtener URL
    # ============================================
    Write-Host "╔════════════════════════════════════════════════╗" -ForegroundColor Red
    Write-Host "║            ⚠️  ERROR CON NGROK                 ║" -ForegroundColor Red
    Write-Host "╚════════════════════════════════════════════════╝" -ForegroundColor Red
    Write-Host ""
    Write-Host "No se pudo obtener la URL de ngrok." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Posibles soluciones:" -ForegroundColor Cyan
    Write-Host "  1. Verifica http://localhost:4040 manualmente" -ForegroundColor Gray
    Write-Host "  2. Revisa si ngrok necesita autenticación" -ForegroundColor Gray
    Write-Host "  3. Verifica tu conexión a internet" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "Presiona Enter para cerrar..." -ForegroundColor Gray
Read-Host
