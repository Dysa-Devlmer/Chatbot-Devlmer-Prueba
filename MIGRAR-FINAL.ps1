# Script de migración con reintentos - Requiere Admin
param([switch]$Elevated)

function Test-Admin {
    $currentUser = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
    $currentUser.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if ((Test-Admin) -eq $false) {
    if ($Elevated) {
        Write-Host "Error: No se pudieron obtener permisos de administrador" -ForegroundColor Red
        Read-Host "Presiona Enter"
        exit
    } else {
        Start-Process powershell.exe -Verb RunAs -ArgumentList ('-NoProfile -ExecutionPolicy Bypass -File "{0}" -Elevated' -f ($myinvocation.MyCommand.Definition))
        exit
    }
}

Set-Location "E:\prueba"
Clear-Host

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  MIGRACION FINAL - PITHY CHATBOT" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Metodo con reintentos automaticos" -ForegroundColor Yellow
Write-Host ""
Read-Host "Presiona Enter para continuar"

# Paso 1: Limpiar carpeta .prisma
Write-Host ""
Write-Host "Eliminando carpeta .prisma..." -ForegroundColor Yellow
Remove-Item -Path "node_modules\.prisma" -Recurse -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

# Paso 2: Intentar generar cliente con reintentos
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host " Generando cliente Prisma (con reintentos)..." -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

$maxRetries = 5
$retryDelay = 5

for ($i = 1; $i -le $maxRetries; $i++) {
    Write-Host "Intento $i de $maxRetries..." -ForegroundColor Yellow

    # Limpiar archivos .tmp anteriores
    Get-ChildItem -Path "node_modules\.prisma" -Filter "*.tmp*" -Recurse -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue

    Start-Sleep -Seconds 2

    $result = & npx prisma generate 2>&1

    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "EXITO: Cliente generado correctamente" -ForegroundColor Green
        $success = $true
        break
    } else {
        Write-Host ""
        Write-Host "Fallo. Esperando $retryDelay segundos..." -ForegroundColor Yellow
        Start-Sleep -Seconds $retryDelay
    }
}

if (-not $success) {
    Write-Host ""
    Write-Host "ERROR: No se pudo generar el cliente despues de $maxRetries intentos" -ForegroundColor Red
    Write-Host ""
    Write-Host "SOLUCION:" -ForegroundColor Yellow
    Write-Host "1. Reinicia tu PC" -ForegroundColor White
    Write-Host "2. Ejecuta este script nuevamente" -ForegroundColor White
    Write-Host ""
    Read-Host "Presiona Enter para cerrar"
    exit 1
}

# Paso 3: Aplicar migraciones
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host " Aplicando cambios a la base de datos..." -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

& npx prisma db push

Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host " MIGRACION COMPLETADA" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Nuevas funcionalidades:" -ForegroundColor Cyan
Write-Host "  - Analytics Dashboard" -ForegroundColor White
Write-Host "  - Quick Replies" -ForegroundColor White
Write-Host "  - Tags/Etiquetas" -ForegroundColor White
Write-Host "  - Configuracion IA" -ForegroundColor White
Write-Host "  - Mensajes Programados" -ForegroundColor White
Write-Host ""
Write-Host "Reinicia el servidor: npm run dev" -ForegroundColor Yellow
Write-Host ""
Read-Host "Presiona Enter para cerrar"
