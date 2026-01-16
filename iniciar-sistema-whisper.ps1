# Script para iniciar el sistema completo con soporte de Whisper
# Versión con transcripción de audio habilitada

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "   SISTEMA PITHY CON WHISPER v2.0   " -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Verificar dependencias
Write-Host "🔍 Verificando dependencias..." -ForegroundColor Yellow

# Verificar Python
$pythonCheck = python --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Python instalado: $pythonCheck" -ForegroundColor Green
} else {
    Write-Host "❌ Python no encontrado. Instálalo desde python.org" -ForegroundColor Red
    exit 1
}

# Verificar faster-whisper
$whisperCheck = python -c "import faster_whisper; print('1.2.1')" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Faster-whisper instalado" -ForegroundColor Green
} else {
    Write-Host "⚠️ Faster-whisper no encontrado. Instalando..." -ForegroundColor Yellow
    pip install faster-whisper
}

# Verificar Ollama
$ollamaCheck = ollama list 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Ollama configurado" -ForegroundColor Green
} else {
    Write-Host "⚠️ Ollama no está corriendo" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🚀 Iniciando servicios..." -ForegroundColor Yellow
Write-Host ""

# 1. Iniciar Ollama (si no está corriendo)
$ollamaRunning = Get-Process "ollama" -ErrorAction SilentlyContinue
if (!$ollamaRunning) {
    Write-Host "1️⃣ Iniciando Ollama..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", `
        "Write-Host '🤖 OLLAMA AI SERVER' -ForegroundColor Green; ollama serve"
    Start-Sleep -Seconds 3
} else {
    Write-Host "1️⃣ Ollama ya está en ejecución ✓" -ForegroundColor Green
}

# 2. Iniciar Next.js
Write-Host "2️⃣ Iniciando Next.js en puerto 7847..." -ForegroundColor Cyan

# Cerrar Next.js anterior si existe
$nextProcess = Get-Process "node" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -like "*next*" }
if ($nextProcess) {
    Write-Host "   Cerrando instancia anterior..." -ForegroundColor DarkGray
    $nextProcess | Stop-Process -Force
    Start-Sleep -Seconds 2
}

Start-Process powershell -ArgumentList "-NoExit", "-Command", `
    "Write-Host '⚡ NEXT.JS SERVER - Puerto 7847' -ForegroundColor Green; Write-Host '🎤 Whisper habilitado para transcripción' -ForegroundColor Yellow; npm run dev"

Start-Sleep -Seconds 5

# 3. Iniciar ngrok
Write-Host "3️⃣ Configurando túnel ngrok..." -ForegroundColor Cyan

# Cerrar ngrok anterior
$ngrokProcess = Get-Process "ngrok" -ErrorAction SilentlyContinue
if ($ngrokProcess) {
    Write-Host "   Cerrando ngrok anterior..." -ForegroundColor DarkGray
    $ngrokProcess | Stop-Process -Force
    Start-Sleep -Seconds 2
}

# Configurar authtoken si es necesario
$authtoken = "35wwl0aH8AloY91Q7jIkP9s0YZW_7SLMa1yUBbZQirVbw3cHX"
& .\ngrok.exe config add-authtoken $authtoken 2>&1 | Out-Null

# Iniciar ngrok
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
    "Write-Host '🌐 NGROK TUNNEL - Puerto 7847' -ForegroundColor Green; .\ngrok.exe http 7847"

# Esperar a que ngrok se inicie completamente
Write-Host ""
Write-Host "⏳ Esperando conexión de ngrok..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

# Obtener URL del webhook
Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "     SISTEMA INICIADO CON ÉXITO     " -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri 'http://localhost:4040/api/tunnels' -ErrorAction Stop
    $publicUrl = $response.tunnels | Where-Object { $_.proto -eq 'https' } | Select-Object -ExpandProperty public_url -First 1

    if (-not $publicUrl) {
        $publicUrl = $response.tunnels[0].public_url
    }

    Write-Host "📌 INFORMACIÓN DE CONFIGURACIÓN:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🔗 Webhook URL:" -ForegroundColor Yellow
    Write-Host "   $publicUrl/api/whatsapp/webhook" -ForegroundColor White
    Write-Host ""
    Write-Host "🔑 Token:" -ForegroundColor Yellow
    Write-Host "   mi_token_secreto_123" -ForegroundColor White
    Write-Host ""
    Write-Host "🖥️ Panel Admin:" -ForegroundColor Yellow
    Write-Host "   http://localhost:7847/admin" -ForegroundColor White
    Write-Host ""
    Write-Host "🎤 TRANSCRIPCIÓN DE AUDIO:" -ForegroundColor Magenta
    Write-Host "   ✅ Whisper habilitado" -ForegroundColor Green
    Write-Host "   📝 Modelo: base (español)" -ForegroundColor White
    Write-Host "   ⚡ Backend: faster-whisper local" -ForegroundColor White
    Write-Host ""

    # Abrir panel admin
    Start-Sleep -Seconds 2
    Start-Process "http://localhost:7847/admin"

} catch {
    Write-Host "⚠️ No se pudo obtener la URL de ngrok" -ForegroundColor Yellow
    Write-Host "   Verifica manualmente en: http://localhost:4040" -ForegroundColor White
}

Write-Host "=====================================" -ForegroundColor Green
Write-Host "✨ FUNCIONALIDADES ACTIVAS:" -ForegroundColor Cyan
Write-Host "   • Respuestas con IA (Ollama)" -ForegroundColor White
Write-Host "   • Transcripción de audio (Whisper)" -ForegroundColor White
Write-Host "   • Analytics en tiempo real" -ForegroundColor White
Write-Host "   • Quick Replies" -ForegroundColor White
Write-Host "   • Mensajes programados" -ForegroundColor White
Write-Host "   • Sistema de etiquetas" -ForegroundColor White
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "📞 El bot responderá automáticamente a:" -ForegroundColor Yellow
Write-Host "   • Mensajes de texto" -ForegroundColor White
Write-Host "   • Mensajes de voz (nuevo!)" -ForegroundColor Green
Write-Host ""
Write-Host "Presiona Ctrl+C en cualquier ventana para cerrar" -ForegroundColor DarkGray