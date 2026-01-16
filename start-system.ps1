# Script de inicio automatico para PITHY Chatbot
Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "    PITHY CHATBOT - Inicio Automatico" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Cambiar al directorio correcto
Set-Location "E:\prueba"

# Verificar Ollama
Write-Host "Verificando Ollama..." -ForegroundColor Yellow
$ollamaRunning = Get-Process -Name "ollama" -ErrorAction SilentlyContinue
if ($ollamaRunning) {
    Write-Host "  [OK] Ollama corriendo" -ForegroundColor Green
} else {
    Write-Host "  Iniciando Ollama..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "ollama serve"
    Start-Sleep -Seconds 5
}

# Verificar Next.js
Write-Host "Verificando Next.js..." -ForegroundColor Yellow
$nextRunning = netstat -ano | Select-String ":7847" | Select-Object -First 1
if ($nextRunning) {
    Write-Host "  [OK] Next.js corriendo en puerto 7847" -ForegroundColor Green
} else {
    Write-Host "  Iniciando Next.js..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"
    Start-Sleep -Seconds 12
}

# Detener ngrok anterior
Write-Host "Configurando ngrok..." -ForegroundColor Yellow
try {
    Stop-Process -Name "ngrok" -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
} catch {}

# Iniciar ngrok
Write-Host "  Iniciando ngrok..." -ForegroundColor Cyan
Start-Process -FilePath ".\ngrok.exe" -ArgumentList "http", "7847"
Start-Sleep -Seconds 8

# Obtener URL
Write-Host ""
Write-Host "Obteniendo URL del webhook..." -ForegroundColor Yellow

$success = $false
$attempts = 0

while (-not $success -and $attempts -lt 5) {
    $attempts++
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels"
        $publicUrl = $response.tunnels[0].public_url

        if ($publicUrl) {
            $webhookUrl = "$publicUrl/api/whatsapp/webhook"
            $success = $true

            Write-Host ""
            Write-Host "===============================================" -ForegroundColor Green
            Write-Host "  SISTEMA INICIADO CORRECTAMENTE" -ForegroundColor Green
            Write-Host "===============================================" -ForegroundColor Green
            Write-Host ""
            Write-Host "Webhook URL:" -ForegroundColor Yellow
            Write-Host $webhookUrl -ForegroundColor White
            Write-Host ""
            Write-Host "Token: mi_token_secreto_123" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "Panel Admin: http://localhost:7847/admin" -ForegroundColor Cyan
            Write-Host "Panel Ngrok: http://localhost:4040" -ForegroundColor Cyan
            Write-Host ""
            Write-Host "===============================================" -ForegroundColor Green
            Write-Host ""

            # Guardar URL
            $webhookUrl | Out-File -FilePath ".\logs\webhook-url.txt" -Force
        }
    } catch {
        Write-Host "  Reintento $attempts..." -ForegroundColor Gray
        Start-Sleep -Seconds 3
    }
}

if (-not $success) {
    Write-Host ""
    Write-Host "ERROR: No se pudo obtener URL de ngrok" -ForegroundColor Red
    Write-Host "Visita http://localhost:4040 manualmente" -ForegroundColor Yellow
    Write-Host ""
}

Read-Host "Presiona Enter para cerrar"
