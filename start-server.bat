@echo off
:: Inicia PowerShell 7 como administrador con el script
powershell -Command "Start-Process pwsh -ArgumentList '-NoExit -ExecutionPolicy Bypass -File \"E:\prueba\start-server.ps1\"' -Verb RunAs"
