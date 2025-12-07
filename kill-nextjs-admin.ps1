# Script con auto-elevación de permisos para cerrar Next.js
param([switch]$Elevated)

function Test-Admin {
    $currentUser = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
    $currentUser.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if ((Test-Admin) -eq $false) {
    if ($Elevated) {
        Write-Host "Error: No se pudieron obtener permisos de administrador" -ForegroundColor Red
    } else {
        Write-Host "Solicitando permisos de administrador..." -ForegroundColor Yellow
        Start-Process powershell.exe -Verb RunAs -ArgumentList ('-NoProfile -ExecutionPolicy Bypass -File "{0}" -Elevated' -f ($myinvocation.MyCommand.Definition))
    }
    exit
}

Write-Host "Ejecutando con permisos de administrador..." -ForegroundColor Green
Write-Host ""

$processId = 31028

Write-Host "Cerrando proceso Next.js (PID: $processId)..." -ForegroundColor Cyan

try {
    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue

    if ($process) {
        Stop-Process -Id $processId -Force
        Start-Sleep -Seconds 2

        $check = Get-Process -Id $processId -ErrorAction SilentlyContinue
        if ($check) {
            Write-Host "Advertencia: El proceso aun existe" -ForegroundColor Yellow
        } else {
            Write-Host "Exito: Proceso cerrado correctamente" -ForegroundColor Green
        }
    } else {
        Write-Host "Proceso no encontrado (puede estar ya cerrado)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "Presiona Enter para cerrar..." -ForegroundColor Gray
Read-Host
