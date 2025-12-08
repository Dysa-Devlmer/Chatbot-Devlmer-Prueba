# Reiniciar solo ngrok
Write-Host "Reiniciando ngrok..." -ForegroundColor Cyan

# Intentar cerrar ngrok de varias formas
Write-Host "Cerrando procesos ngrok anteriores..." -ForegroundColor Yellow

# Metodo 1: PowerShell
try { Stop-Process -Name "ngrok" -Force -ErrorAction SilentlyContinue } catch {}

# Metodo 2: taskkill
Start-Sleep -Seconds 2
$ngrokProcesses = Get-WmiObject Win32_Process -Filter "name = 'ngrok.exe'"
foreach ($process in $ngrokProcesses) {
    try {
        $process.Terminate() | Out-Null
        Write-Host "  Proceso $($process.ProcessId) terminado" -ForegroundColor Gray
    } catch {}
}

Start-Sleep -Seconds 3

# Verificar que no haya procesos
$stillRunning = Get-Process -Name "ngrok" -ErrorAction SilentlyContinue
if ($stillRunning) {
    Write-Host "  ADVERTENCIA: Algunos procesos ngrok aun estan activos" -ForegroundColor Yellow
    Write-Host "  Es posible que necesites reiniciar manualmente" -ForegroundColor Yellow
} else {
    Write-Host "  Todos los procesos ngrok cerrados" -ForegroundColor Green
}

Write-Host ""
Write-Host "Iniciando ngrok nuevo..." -ForegroundColor Green

# Iniciar ngrok en ventana visible
$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = "E:\prueba\ngrok.exe"
$psi.Arguments = "http 7847"
$psi.WorkingDirectory = "E:\prueba"
$psi.UseShellExecute = $true
$psi.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Normal

$process = [System.Diagnostics.Process]::Start($psi)

Write-Host "  Ngrok iniciado (PID: $($process.Id))" -ForegroundColor Cyan
Write-Host "  Esperando 10 segundos para que se conecte..." -ForegroundColor Gray

Start-Sleep -Seconds 10

# Intentar obtener URL
Write-Host ""
Write-Host "Obteniendo URL publica..." -ForegroundColor Yellow

for ($i = 1; $i -le 5; $i++) {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -TimeoutSec 5

        if ($response.tunnels -and $response.tunnels.Count -gt 0) {
            $tunnel = $response.tunnels | Where-Object { $_.proto -eq 'https' } | Select-Object -First 1

            if (-not $tunnel) {
                $tunnel = $response.tunnels[0]
            }

            $publicUrl = $tunnel.public_url
            $webhookUrl = "$publicUrl/api/whatsapp/webhook"

            Write-Host ""
            Write-Host "========================================" -ForegroundColor Green
            Write-Host "  NGROK CONECTADO!" -ForegroundColor Green
            Write-Host "========================================" -ForegroundColor Green
            Write-Host ""
            Write-Host "URL Webhook:" -ForegroundColor Yellow
            Write-Host $webhookUrl -ForegroundColor White
            Write-Host ""
            Write-Host "Token: mi_token_secreto_123" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "Panel: http://localhost:4040" -ForegroundColor Cyan
            Write-Host "========================================" -ForegroundColor Green
            Write-Host ""

            # Guardar
            $webhookUrl | Out-File -FilePath ".\logs\webhook-url.txt" -Force

            break
        }
    } catch {
        Write-Host "  Intento $i/5 - Esperando..." -ForegroundColor Gray
        Start-Sleep -Seconds 4
    }
}

Read-Host "Presiona Enter para cerrar"
