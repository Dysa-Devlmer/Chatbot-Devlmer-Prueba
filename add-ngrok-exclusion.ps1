# ========================================
# Script: Agregar ngrok a exclusiones de Windows Defender
# Proposito: Evitar que Windows Defender elimine ngrok.exe
# Ejecucion: Automatica con auto-elevacion a Administrador
# ========================================

# Auto-elevacion a Administrador
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host "  SOLICITANDO PERMISOS DE ADMINISTRADOR" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Este script necesita permisos de administrador para:" -ForegroundColor Cyan
    Write-Host "  1. Agregar ngrok.exe a exclusiones de Windows Defender" -ForegroundColor White
    Write-Host "  2. Evitar que el antivirus elimine ngrok.exe" -ForegroundColor White
    Write-Host ""
    Write-Host "Presiona 'Si' en el UAC que aparecera..." -ForegroundColor Green
    Write-Host ""

    # Re-ejecutar como administrador
    Start-Process "C:\Program Files\PowerShell\7\pwsh.exe" -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
    exit
}

# ========================================
# SCRIPT PRINCIPAL (Ya ejecutandose como Admin)
# ========================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  CONFIGURANDO EXCLUSIONES DE NGROK" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

$ngrokPath = "E:\prueba\ngrok.exe"
$ngrokDir = "E:\prueba"

# Verificar que ngrok.exe existe
if (-not (Test-Path $ngrokPath)) {
    Write-Host "[ERROR] No se encontro ngrok.exe en: $ngrokPath" -ForegroundColor Red
    Write-Host ""
    pause
    exit 1
}

Write-Host "[1/4] Verificando archivo ngrok.exe..." -ForegroundColor Cyan
Write-Host "      Ubicacion: $ngrokPath" -ForegroundColor White
Write-Host "      Estado: ENCONTRADO" -ForegroundColor Green
Write-Host ""

# Agregar exclusion por ruta de archivo
Write-Host "[2/4] Agregando exclusion por RUTA..." -ForegroundColor Cyan
try {
    Add-MpPreference -ExclusionPath $ngrokPath -ErrorAction Stop
    Write-Host "      OK: Ruta agregada a exclusiones" -ForegroundColor Green
} catch {
    if ($_.Exception.Message -like "*already exists*" -or $_.Exception.Message -like "*ya existe*") {
        Write-Host "      OK: Ruta ya estaba en exclusiones" -ForegroundColor Yellow
    } else {
        Write-Host "      ERROR: $($_.Exception.Message)" -ForegroundColor Red
    }
}
Write-Host ""

# Agregar exclusion por proceso
Write-Host "[3/4] Agregando exclusion por PROCESO..." -ForegroundColor Cyan
try {
    Add-MpPreference -ExclusionProcess "ngrok.exe" -ErrorAction Stop
    Write-Host "      OK: Proceso agregado a exclusiones" -ForegroundColor Green
} catch {
    if ($_.Exception.Message -like "*already exists*" -or $_.Exception.Message -like "*ya existe*") {
        Write-Host "      OK: Proceso ya estaba en exclusiones" -ForegroundColor Yellow
    } else {
        Write-Host "      ERROR: $($_.Exception.Message)" -ForegroundColor Red
    }
}
Write-Host ""

# Agregar exclusion por directorio (opcional pero recomendado)
Write-Host "[4/4] Agregando exclusion por DIRECTORIO..." -ForegroundColor Cyan
try {
    Add-MpPreference -ExclusionPath $ngrokDir -ErrorAction Stop
    Write-Host "      OK: Directorio agregado a exclusiones" -ForegroundColor Green
} catch {
    if ($_.Exception.Message -like "*already exists*" -or $_.Exception.Message -like "*ya existe*") {
        Write-Host "      OK: Directorio ya estaba en exclusiones" -ForegroundColor Yellow
    } else {
        Write-Host "      ERROR: $($_.Exception.Message)" -ForegroundColor Red
    }
}
Write-Host ""

# Verificar exclusiones
Write-Host "========================================" -ForegroundColor Green
Write-Host "  VERIFICANDO CONFIGURACION" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

try {
    $preferences = Get-MpPreference

    Write-Host "Exclusiones de RUTAS:" -ForegroundColor Cyan
    $exclusionPaths = $preferences.ExclusionPath | Where-Object { $_ -like "*ngrok*" -or $_ -like "*prueba*" }
    if ($exclusionPaths) {
        $exclusionPaths | ForEach-Object { Write-Host "  - $_" -ForegroundColor White }
    } else {
        Write-Host "  (Ninguna relacionada con ngrok)" -ForegroundColor Yellow
    }
    Write-Host ""

    Write-Host "Exclusiones de PROCESOS:" -ForegroundColor Cyan
    $exclusionProcesses = $preferences.ExclusionProcess | Where-Object { $_ -like "*ngrok*" }
    if ($exclusionProcesses) {
        $exclusionProcesses | ForEach-Object { Write-Host "  - $_" -ForegroundColor White }
    } else {
        Write-Host "  (Ninguna relacionada con ngrok)" -ForegroundColor Yellow
    }
    Write-Host ""
} catch {
    Write-Host "No se pudieron listar las exclusiones (esto es normal en algunos casos)" -ForegroundColor Yellow
    Write-Host ""
}

# Resumen final
Write-Host "========================================" -ForegroundColor Green
Write-Host "  CONFIGURACION COMPLETADA" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Windows Defender ahora IGNORARA:" -ForegroundColor Cyan
Write-Host "  1. El archivo ngrok.exe" -ForegroundColor White
Write-Host "  2. El proceso ngrok.exe cuando se ejecute" -ForegroundColor White
Write-Host "  3. El directorio E:\prueba\" -ForegroundColor White
Write-Host ""
Write-Host "POR QUE ES SEGURO:" -ForegroundColor Yellow
Write-Host "  - Ngrok es una herramienta LEGITIMA de desarrollo" -ForegroundColor White
Write-Host "  - Usada por millones de desarrolladores en el mundo" -ForegroundColor White
Write-Host "  - Necesaria para recibir webhooks de WhatsApp" -ForegroundColor White
Write-Host "  - Creada por ngrok Inc. (empresa confiable)" -ForegroundColor White
Write-Host ""
Write-Host "ANTIVIRUS LO DETECTA PORQUE:" -ForegroundColor Yellow
Write-Host "  - Crea tuneles de red (funcionalidad normal)" -ForegroundColor White
Write-Host "  - Los hackers a veces abusan de esta herramienta" -ForegroundColor White
Write-Host "  - Es un FALSO POSITIVO muy comun en DevOps" -ForegroundColor White
Write-Host ""
Write-Host "ALTERNATIVAS SI NO CONFIAS EN NGROK:" -ForegroundColor Cyan
Write-Host "  1. Cloudflare Tunnel (gratis, similar a ngrok)" -ForegroundColor White
Write-Host "  2. Serveo (ssh -R, gratuito)" -ForegroundColor White
Write-Host "  3. LocalTunnel (npm install -g localtunnel)" -ForegroundColor White
Write-Host "  4. Tailscale Funnel (VPN + tunnel)" -ForegroundColor White
Write-Host "  5. Servidor VPS propio con reverse proxy" -ForegroundColor White
Write-Host ""
Write-Host "Presiona cualquier tecla para cerrar..." -ForegroundColor Gray
pause | Out-Null
