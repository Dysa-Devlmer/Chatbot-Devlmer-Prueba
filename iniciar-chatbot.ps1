# Script para iniciar todo el sistema del chatbot JARVIS
Write-Host "🚀 Iniciando JARVIS Chatbot..." -ForegroundColor Green
Write-Host ""

# Verificar que estamos en el directorio correcto
$currentDir = Get-Location
if ($currentDir.Path -ne "E:\prueba") {
    Set-Location "E:\prueba"
    Write-Host "📂 Cambiando al directorio: E:\prueba" -ForegroundColor Cyan
}

# Crear carpeta de logs si no existe
if (-not (Test-Path "logs")) {
    New-Item -ItemType Directory -Path "logs" -Force | Out-Null
}

Write-Host "1️⃣  Iniciando Ollama..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '🤖 Ollama AI Server' -ForegroundColor Green; ollama serve" -WindowStyle Normal

Write-Host "   ⏳ Esperando a que Ollama se inicie..." -ForegroundColor Gray
Start-Sleep -Seconds 5

Write-Host "2️⃣  Iniciando servidor Next.js..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '⚡ Next.js Server - Puerto 7847' -ForegroundColor Green; npm run dev" -WindowStyle Normal

Write-Host "   ⏳ Esperando a que el servidor se inicie..." -ForegroundColor Gray
Start-Sleep -Seconds 10

Write-Host "3️⃣  Iniciando túnel ngrok..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '🌐 Ngrok Tunnel - Puerto 7847' -ForegroundColor Green; .\ngrok.exe http 7847" -WindowStyle Normal

Write-Host "   ⏳ Esperando a que ngrok se conecte..." -ForegroundColor Gray
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "✅ Todos los servicios iniciados!" -ForegroundColor Green
Write-Host ""

# Obtener y mostrar la URL de ngrok
try {
    # Intentar puerto 4040 primero, luego 4847
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -ErrorAction Stop
    } catch {
        $response = Invoke-RestMethod -Uri "http://localhost:4847/api/tunnels"
    }
    $publicUrl = $response.tunnels | Where-Object { $_.proto -eq 'https' } | Select-Object -ExpandProperty public_url -First 1
    if (-not $publicUrl) {
        $publicUrl = $response.tunnels[0].public_url
    }

    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "  🌐 URL DEL WEBHOOK" -ForegroundColor Green
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  $publicUrl/api/whatsapp/webhook" -ForegroundColor White
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "💡 Ahora el chatbot está listo para recibir mensajes" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "🔧 Configuración del horario:" -ForegroundColor Cyan
    Write-Host "   - Edita: config-horarios.json" -ForegroundColor White
    Write-Host "   - Para cambiar mensajes y horarios de atención" -ForegroundColor Gray
    Write-Host ""
    Write-Host "🛑 Para detener todos los servicios:" -ForegroundColor Cyan
    Write-Host "   powershell -ExecutionPolicy Bypass -File detener-chatbot.ps1" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "⚠️  No se pudo obtener la URL de ngrok" -ForegroundColor Yellow
    Write-Host "   Ejecuta get-url.ps1 en unos segundos" -ForegroundColor Gray
}

Write-Host "Presiona cualquier tecla para cerrar esta ventana..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
