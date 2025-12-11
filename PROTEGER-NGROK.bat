@echo off
REM ========================================
REM Script: Proteger ngrok de Windows Defender
REM Uso: Doble click para ejecutar
REM ========================================

echo.
echo ========================================
echo   PROTEGER NGROK DEL ANTIVIRUS
echo ========================================
echo.
echo Este script agregara ngrok.exe a las exclusiones
echo de Windows Defender automaticamente.
echo.
echo Se abrira una ventana UAC solicitando permisos...
echo.
pause

REM Ejecutar PowerShell con auto-elevacion
"C:\Program Files\PowerShell\7\pwsh.exe" -NoProfile -ExecutionPolicy Bypass -File "%~dp0add-ngrok-exclusion.ps1"

echo.
echo Script finalizado.
pause
