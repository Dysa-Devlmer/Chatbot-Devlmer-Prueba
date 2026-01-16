# Reset de Fortaleza
$ErrorActionPreference = 'SilentlyContinue'
Remove-Item -Path './secreto.txt.jpg','./.intentos','./queso.honey','./secreto.txt','./Activar_Seguridad.ps1' -Force
Write-Host 'Fortaleza reiniciada. Archivos eliminados.' -ForegroundColor Green
Pause
