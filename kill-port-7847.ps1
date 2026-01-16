# Script con auto-elevación para cerrar proceso en puerto 7847
param([switch]$Elevated)

function Test-Admin {
    $currentUser = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
    $currentUser.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if ((Test-Admin) -eq $false) {
    if ($Elevated) {
        Write-Host "Error: No se pudieron obtener permisos de administrador" -ForegroundColor Red
    } else {
        Start-Process powershell.exe -Verb RunAs -ArgumentList ('-NoProfile -ExecutionPolicy Bypass -File "{0}" -Elevated' -f ($myinvocation.MyCommand.Definition))
    }
    exit
}

Write-Host "Cerrando proceso en puerto 7847..." -ForegroundColor Cyan

# Obtener PID del proceso que usa el puerto 7847
$netstatOutput = netstat -ano | Select-String ":7847.*LISTENING"
if ($netstatOutput) {
    $line = $netstatOutput[0].ToString()
    $pid = ($line -split '\s+')[-1]

    Write-Host "Proceso encontrado: PID $pid" -ForegroundColor Yellow

    try {
        Stop-Process -Id $pid -Force
        Start-Sleep -Seconds 2
        Write-Host "Proceso cerrado exitosamente" -ForegroundColor Green
    } catch {
        Write-Host "Error al cerrar: $_" -ForegroundColor Red
    }
} else {
    Write-Host "No se encontro proceso en puerto 7847" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Presiona Enter para cerrar..." -ForegroundColor Gray
Read-Host
