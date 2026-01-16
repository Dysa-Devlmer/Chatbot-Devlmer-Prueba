# Script para terminar el proceso Next.js
$processId = 18648

Write-Host "Intentando terminar proceso Next.js (PID: $processId)..." -ForegroundColor Yellow

try {
    $process = Get-WmiObject Win32_Process -Filter "ProcessId=$processId"

    if ($process) {
        $result = $process.Terminate()

        if ($result.ReturnValue -eq 0) {
            Write-Host "Proceso terminado exitosamente" -ForegroundColor Green
            Start-Sleep -Seconds 2

            # Verificar que se cerro
            $check = Get-Process -Id $processId -ErrorAction SilentlyContinue
            if ($check) {
                Write-Host "Advertencia: El proceso aun existe" -ForegroundColor Yellow
            } else {
                Write-Host "Confirmado: Proceso cerrado" -ForegroundColor Green
            }
        } else {
            Write-Host "Error al terminar proceso. Codigo: $($result.ReturnValue)" -ForegroundColor Red
            Write-Host "Intenta cerrar manualmente desde el Administrador de Tareas" -ForegroundColor Yellow
        }
    } else {
        Write-Host "Proceso no encontrado (puede que ya este cerrado)" -ForegroundColor Green
    }
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
