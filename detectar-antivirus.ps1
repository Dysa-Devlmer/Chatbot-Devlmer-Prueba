# ========================================
# Script: Detectar antivirus instalado
# ========================================

# Auto-elevacion a Administrador
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Start-Process "C:\Program Files\PowerShell\7\pwsh.exe" -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
    exit
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DETECTANDO SOFTWARE ANTIVIRUS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Detectar productos antivirus instalados
Write-Host "[1] Consultando WMI Security Center..." -ForegroundColor Yellow
Write-Host ""

try {
    $antivirusProducts = Get-CimInstance -Namespace root/SecurityCenter2 -ClassName AntivirusProduct -ErrorAction Stop

    if ($antivirusProducts) {
        Write-Host "ANTIVIRUS DETECTADOS:" -ForegroundColor Green
        Write-Host ""

        foreach ($av in $antivirusProducts) {
            Write-Host "  Nombre: $($av.displayName)" -ForegroundColor White
            Write-Host "  Estado: " -NoNewline

            # Decodificar estado
            $hexString = [System.Convert]::ToString($av.productState, 16).PadLeft(6, '0')
            $enabled = $hexString.Substring(2, 2)
            $updated = $hexString.Substring(4, 2)

            if ($enabled -eq "10") {
                Write-Host "ACTIVADO" -ForegroundColor Green
            } elseif ($enabled -eq "00") {
                Write-Host "DESACTIVADO" -ForegroundColor Red
            } else {
                Write-Host "DESCONOCIDO ($enabled)" -ForegroundColor Yellow
            }

            Write-Host "  Ruta: $($av.pathToSignedProductExe)" -ForegroundColor Gray
            Write-Host ""
        }
    } else {
        Write-Host "  No se detectaron productos antivirus" -ForegroundColor Yellow
        Write-Host ""
    }
} catch {
    Write-Host "  ERROR: No se pudo consultar SecurityCenter2" -ForegroundColor Red
    Write-Host "  Detalles: $($_.Exception.Message)" -ForegroundColor Gray
    Write-Host ""
}

# Detectar Windows Defender específicamente
Write-Host "[2] Verificando Windows Defender..." -ForegroundColor Yellow
Write-Host ""

try {
    $defenderStatus = Get-MpComputerStatus -ErrorAction Stop

    Write-Host "  Estado de Windows Defender:" -ForegroundColor White
    Write-Host "    Antivirus habilitado: $($defenderStatus.AntivirusEnabled)" -ForegroundColor $(if($defenderStatus.AntivirusEnabled){"Green"}else{"Red"})
    Write-Host "    Antimalware habilitado: $($defenderStatus.AntimalwareEnabled)" -ForegroundColor $(if($defenderStatus.AntimalwareEnabled){"Green"}else{"Red"})
    Write-Host "    Proteccion en tiempo real: $($defenderStatus.RealTimeProtectionEnabled)" -ForegroundColor $(if($defenderStatus.RealTimeProtectionEnabled){"Green"}else{"Red"})
    Write-Host ""

} catch {
    Write-Host "  Windows Defender: NO DISPONIBLE o DESHABILITADO" -ForegroundColor Red
    Write-Host "  Codigo error: $($_.Exception.HResult)" -ForegroundColor Gray
    Write-Host ""
}

# Servicios antivirus en ejecución
Write-Host "[3] Servicios antivirus activos..." -ForegroundColor Yellow
Write-Host ""

$avServices = @(
    "WinDefend",           # Windows Defender
    "SamSs",              # Windows Defender Advanced
    "Sense",              # Windows Defender ATP
    "avast",              # Avast
    "AVG",                # AVG
    "NortonSecurity",     # Norton
    "KASPERSKY",          # Kaspersky
    "ESET",               # ESET
    "McAfee",             # McAfee
    "TrendMicro",         # Trend Micro
    "Sophos",             # Sophos
    "Bitdefender",        # Bitdefender
    "MsMpSvc"             # Microsoft Malware Protection
)

$foundServices = @()
foreach ($svc in $avServices) {
    $service = Get-Service -Name $svc -ErrorAction SilentlyContinue
    if ($service) {
        $foundServices += $service
        Write-Host "  $($service.DisplayName)" -ForegroundColor White
        Write-Host "    Estado: $($service.Status)" -ForegroundColor $(if($service.Status -eq "Running"){"Green"}else{"Yellow"})
        Write-Host "    Servicio: $($service.Name)" -ForegroundColor Gray
        Write-Host ""
    }
}

if ($foundServices.Count -eq 0) {
    Write-Host "  No se detectaron servicios antivirus conocidos" -ForegroundColor Yellow
    Write-Host ""
}

# Procesos antivirus
Write-Host "[4] Procesos antivirus en ejecución..." -ForegroundColor Yellow
Write-Host ""

$avProcesses = @(
    "MsMpEng",            # Windows Defender
    "MpCmdRun",          # Windows Defender CLI
    "NisSrv",            # Windows Defender Network
    "AvastUI",           # Avast
    "avgui",             # AVG
    "Norton",            # Norton
    "avp",               # Kaspersky
    "ekrn",              # ESET
    "mcshield",          # McAfee
    "PccNTMon",          # Trend Micro
    "SophosHealth",      # Sophos
    "bdagent"            # Bitdefender
)

$foundProcesses = @()
foreach ($proc in $avProcesses) {
    $process = Get-Process -Name $proc -ErrorAction SilentlyContinue
    if ($process) {
        $foundProcesses += $process
        Write-Host "  $($process.ProcessName)" -ForegroundColor White
        Write-Host "    PID: $($process.Id)" -ForegroundColor Gray
        Write-Host "    Memoria: $([math]::Round($process.WorkingSet64 / 1MB, 2)) MB" -ForegroundColor Gray
        Write-Host ""
    }
}

if ($foundProcesses.Count -eq 0) {
    Write-Host "  No se detectaron procesos antivirus conocidos" -ForegroundColor Yellow
    Write-Host ""
}

# Resumen y recomendaciones
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DIAGNOSTICO Y RECOMENDACIONES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($antivirusProducts) {
    $mainAV = $antivirusProducts[0].displayName

    Write-Host "Tu antivirus principal es: $mainAV" -ForegroundColor Green
    Write-Host ""
    Write-Host "INSTRUCCIONES PARA AGREGAR EXCLUSION:" -ForegroundColor Yellow
    Write-Host ""

    switch -Wildcard ($mainAV) {
        "*Windows Defender*" {
            Write-Host "  WINDOWS DEFENDER:" -ForegroundColor Cyan
            Write-Host "  1. Abre 'Seguridad de Windows'" -ForegroundColor White
            Write-Host "  2. Ve a 'Protección contra virus y amenazas'" -ForegroundColor White
            Write-Host "  3. Click 'Administrar configuración'" -ForegroundColor White
            Write-Host "  4. Baja hasta 'Exclusiones'" -ForegroundColor White
            Write-Host "  5. Click 'Agregar o quitar exclusiones'" -ForegroundColor White
            Write-Host "  6. Agrega: E:\prueba\ngrok.exe" -ForegroundColor Green
        }
        "*Avast*" {
            Write-Host "  AVAST:" -ForegroundColor Cyan
            Write-Host "  1. Abre Avast" -ForegroundColor White
            Write-Host "  2. Menu > Configuración" -ForegroundColor White
            Write-Host "  3. General > Exclusiones" -ForegroundColor White
            Write-Host "  4. Agrega: E:\prueba\ngrok.exe" -ForegroundColor Green
        }
        "*AVG*" {
            Write-Host "  AVG:" -ForegroundColor Cyan
            Write-Host "  1. Abre AVG" -ForegroundColor White
            Write-Host "  2. Menu > Configuración" -ForegroundColor White
            Write-Host "  3. Componentes > Protección de archivos" -ForegroundColor White
            Write-Host "  4. Excepciones > Agrega: E:\prueba\ngrok.exe" -ForegroundColor Green
        }
        "*Norton*" {
            Write-Host "  NORTON:" -ForegroundColor Cyan
            Write-Host "  1. Abre Norton" -ForegroundColor White
            Write-Host "  2. Configuración > Antivirus" -ForegroundColor White
            Write-Host "  3. Exclusiones/Poco riesgo" -ForegroundColor White
            Write-Host "  4. Agrega: E:\prueba\ngrok.exe" -ForegroundColor Green
        }
        "*Kaspersky*" {
            Write-Host "  KASPERSKY:" -ForegroundColor Cyan
            Write-Host "  1. Abre Kaspersky" -ForegroundColor White
            Write-Host "  2. Configuración > Adicional > Amenazas y exclusiones" -ForegroundColor White
            Write-Host "  3. Administrar exclusiones" -ForegroundColor White
            Write-Host "  4. Agrega: E:\prueba\ngrok.exe" -ForegroundColor Green
        }
        "*ESET*" {
            Write-Host "  ESET:" -ForegroundColor Cyan
            Write-Host "  1. Abre ESET" -ForegroundColor White
            Write-Host "  2. F5 (Configuración avanzada)" -ForegroundColor White
            Write-Host "  3. Antivirus > Exclusiones" -ForegroundColor White
            Write-Host "  4. Agrega: E:\prueba\ngrok.exe" -ForegroundColor Green
        }
        default {
            Write-Host "  ANTIVIRUS GENERICO:" -ForegroundColor Cyan
            Write-Host "  1. Abre tu antivirus" -ForegroundColor White
            Write-Host "  2. Busca 'Configuración' o 'Settings'" -ForegroundColor White
            Write-Host "  3. Busca 'Exclusiones' o 'Exceptions'" -ForegroundColor White
            Write-Host "  4. Agrega archivo: E:\prueba\ngrok.exe" -ForegroundColor Green
            Write-Host "  5. Agrega proceso: ngrok.exe" -ForegroundColor Green
        }
    }

    Write-Host ""
    Write-Host "ALTERNATIVA: Desactivar antivirus temporalmente" -ForegroundColor Yellow
    Write-Host "  - Solo mientras trabajas en desarrollo" -ForegroundColor Gray
    Write-Host "  - NO RECOMENDADO para uso prolongado" -ForegroundColor Red
    Write-Host ""

} else {
    Write-Host "No se detectó ningún antivirus activo" -ForegroundColor Yellow
    Write-Host "Esto puede significar:" -ForegroundColor White
    Write-Host "  - Windows Defender está deshabilitado" -ForegroundColor Gray
    Write-Host "  - Hay un antivirus que no se detectó" -ForegroundColor Gray
    Write-Host "  - El sistema no tiene protección antivirus" -ForegroundColor Red
    Write-Host ""
}

Write-Host "Presiona cualquier tecla para cerrar..." -ForegroundColor Gray
pause | Out-Null
