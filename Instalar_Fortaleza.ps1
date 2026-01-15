# Configuracion
$RutaScriptOriginal = "E:\Sistemas\Seguridad de alto nivel\MiFortaleza\fortaleza.py"
$NombreLanzador = "Activar_Seguridad.ps1"
$NombreReset = "Reset_Fortaleza.ps1"

Write-Host "Instalando Fortaleza Digital en: $($ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath('.\'))" -ForegroundColor Cyan

$Contenido = @"
# Lanzador de Seguridad
Write-Host 'Iniciando Fortaleza...' -ForegroundColor Yellow
if (-not (Test-Path './secreto.txt')) { Set-Content -Path './secreto.txt' -Value 'Escribe tu secreto aqui' }
try { attrib +h ./secreto.txt } catch {}
& "C:\Users\zeNk0\AppData\Local\Microsoft\WindowsApps\python3.13.exe" "$RutaScriptOriginal"
Pause
"@

$Contenido | Out-File -FilePath $NombreLanzador -Encoding utf8

$ResetContenido = @"
# Reset de Fortaleza
`$ErrorActionPreference = 'SilentlyContinue'
Remove-Item -Path './secreto.txt.jpg','./.intentos','./queso.honey','./secreto.txt','./Activar_Seguridad.ps1' -Force
Write-Host 'Fortaleza reiniciada. Archivos eliminados.' -ForegroundColor Green
Pause
"@

$ResetContenido | Out-File -FilePath $NombreReset -Encoding utf8

Write-Host "Listo! Usa '$NombreLanzador' para proteger esta carpeta." -ForegroundColor Green
Write-Host "Listo! Usa '$NombreReset' para reiniciar la carpeta." -ForegroundColor Green
