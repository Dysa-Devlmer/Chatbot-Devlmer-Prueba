# Script para iniciar solo ngrok y obtener la URL del webhook
Write-Host "🌐 Iniciando túnel ngrok..." -ForegroundColor Green
Write-Host ""

# Matar cualquier proceso ngrok anterior
try {
    Stop-Process -Name "ngrok" -Force -ErrorAction SilentlyContinue
    Write-Host "✓ Procesos ngrok anteriores terminados" -ForegroundColor Yellow
    Start-Sleep -Seconds 2
} catch {
    # No hay procesos ngrok corriendo
}

# Iniciar ngrok
Write-Host "🚀 Iniciando ngrok en puerto 7847..." -ForegroundColor Cyan
Start-Process -FilePath ".\ngrok.exe" -ArgumentList "http","7847" -WindowStyle Normal

Write-Host "⏳ Esperando a que ngrok se conecte..." -ForegroundColor Gray
Start-Sleep -Seconds 7

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  🌐 INFORMACIÓN DEL WEBHOOK" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Obtener y mostrar la URL de ngrok
try {
    $response = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels"
    $publicUrl = $response.tunnels | Where-Object { $_.proto -eq 'https' } | Select-Object -ExpandProperty public_url -First 1

    if (-not $publicUrl) {
        $publicUrl = $response.tunnels[0].public_url
    }

    Write-Host "  📍 URL del Webhook:" -ForegroundColor White
    Write-Host "  $publicUrl/api/whatsapp/webhook" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  🔑 Token de Verificación:" -ForegroundColor White
    Write-Host "  mi_token_secreto_123" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "✅ Ngrok está listo!" -ForegroundColor Green
    Write-Host ""
    Write-Host "💡 Configura esta URL en Meta Developer Console:" -ForegroundColor Cyan
    Write-Host "   https://developers.facebook.com/apps" -ForegroundColor Gray
    Write-Host ""
    Write-Host "📊 Panel de ngrok: http://localhost:4040" -ForegroundColor Cyan
    Write-Host ""

} catch {
    Write-Host "❌ Error al obtener la URL de ngrok" -ForegroundColor Red
    Write-Host "   Verifica que ngrok se haya iniciado correctamente" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   Puedes ver el panel de ngrok en: http://localhost:4040" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "Presiona cualquier tecla para cerrar..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
