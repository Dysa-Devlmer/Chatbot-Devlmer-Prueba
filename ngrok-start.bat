@echo off
echo Deteniendo ngrok anterior...
taskkill /F /IM ngrok.exe >nul 2>&1
timeout /t 3 >nul

echo Iniciando ngrok en puerto 7847...
start "Ngrok Tunnel" /D "E:\prueba" ngrok.exe http 7847

echo Esperando conexion...
timeout /t 10 >nul

echo.
echo Obteniendo URL...
powershell -Command "$response = Invoke-RestMethod -Uri 'http://localhost:4040/api/tunnels'; $url = $response.tunnels[0].public_url; Write-Host ''; Write-Host '========================================'; Write-Host 'Webhook URL:' -ForegroundColor Yellow; Write-Host \"$url/api/whatsapp/webhook\" -ForegroundColor Green; Write-Host ''; Write-Host 'Token: mi_token_secreto_123' -ForegroundColor Cyan; Write-Host '========================================'; Write-Host ''; $url | Out-File -FilePath '.\logs\webhook-url.txt' -Force"

pause
