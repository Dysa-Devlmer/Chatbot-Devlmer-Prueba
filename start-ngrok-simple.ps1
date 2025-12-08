# Script simple para iniciar ngrok
Write-Host "Cerrando ngrok anterior..." -ForegroundColor Yellow
Stop-Process -Name "ngrok" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Write-Host "Iniciando ngrok en puerto 7847..." -ForegroundColor Green
Start-Process -FilePath ".\ngrok.exe" -ArgumentList "http","7847"

Write-Host "Esperando conexion..." -ForegroundColor Cyan
Start-Sleep -Seconds 7

try {
    $response = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels"
    $publicUrl = $response.tunnels | Where-Object { $_.proto -eq 'https' } | Select-Object -ExpandProperty public_url -First 1

    if (-not $publicUrl) {
        $publicUrl = $response.tunnels[0].public_url
    }

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Webhook URL:" -ForegroundColor Green
    Write-Host "$publicUrl/api/whatsapp/webhook" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Token: mi_token_secreto_123" -ForegroundColor White
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
} catch {
    Write-Host "Error obteniendo URL. Visita http://localhost:4040" -ForegroundColor Red
}
