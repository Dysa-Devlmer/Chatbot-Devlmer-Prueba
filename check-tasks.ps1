# Buscar servicios de Windows relacionados con el proyecto
Write-Host "=== Buscando servicios de Windows ===" -ForegroundColor Cyan
$services = Get-Service | Where-Object {
    $_.DisplayName -like '*Next*' -or
    $_.DisplayName -like '*Node*' -or
    $_.DisplayName -like '*Chatbot*' -or
    $_.DisplayName -like '*PITHY*' -or
    $_.Name -like '*PITHY*'
}

if ($services) {
    $services | Select-Object Name, DisplayName, Status | Format-Table
} else {
    Write-Host "No se encontraron servicios relacionados" -ForegroundColor Green
}

# Verificar si existe NSSM
Write-Host "`n=== Verificando NSSM ===" -ForegroundColor Cyan
if (Test-Path "E:\prueba\nssm.exe") {
    Write-Host "NSSM encontrado, listando servicios..." -ForegroundColor Yellow
    & "E:\prueba\nssm.exe" list
} else {
    Write-Host "NSSM no encontrado en E:\prueba" -ForegroundColor Green
}

# Verificar puerto 7847
Write-Host "`n=== Puerto 7847 ===" -ForegroundColor Cyan
$port7847 = Get-NetTCPConnection -LocalPort 7847 -ErrorAction SilentlyContinue
if ($port7847) {
    Write-Host "Puerto 7847 OCUPADO por PID: $($port7847.OwningProcess)" -ForegroundColor Red
    $process = Get-Process -Id $port7847.OwningProcess -ErrorAction SilentlyContinue
    if ($process) {
        Write-Host "  Proceso: $($process.ProcessName) - Ruta: $($process.Path)" -ForegroundColor Yellow
    }
} else {
    Write-Host "Puerto 7847 está LIBRE" -ForegroundColor Green
}
