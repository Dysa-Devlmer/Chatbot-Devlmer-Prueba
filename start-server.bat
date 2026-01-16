@echo off
:: Script compatible con Windows 10/11 estandar
:: Inicia PowerShell (version incluida en Windows) como administrador

:: Obtener directorio actual del script
set "SCRIPT_DIR=%~dp0"

:: Ejecutar con PowerShell estandar de Windows (no requiere pwsh)
powershell -Command "Start-Process powershell -ArgumentList '-NoExit -ExecutionPolicy Bypass -File \"%SCRIPT_DIR%start-server.ps1\"' -Verb RunAs"
