# Script para actualizar la base de datos del chatbot
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Actualizacion de Base de Datos" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Set-Location "E:\prueba"

Write-Host "IMPORTANTE: Este script requiere detener temporalmente el servidor Next.js" -ForegroundColor Yellow
Write-Host ""
Write-Host "Pasos a seguir:" -ForegroundColor Cyan
Write-Host "1. Cierra la ventana de PowerShell donde corre Next.js" -ForegroundColor White
Write-Host "2. Presiona Enter aqui para continuar" -ForegroundColor White
Write-Host "3. Las migraciones se ejecutaran automaticamente" -ForegroundColor White
Write-Host "4. El servidor se reiniciara cuando termine" -ForegroundColor White
Write-Host ""

Read-Host "Presiona Enter cuando hayas cerrado el servidor Next.js"

Write-Host ""
Write-Host "Ejecutando migraciones de Prisma..." -ForegroundColor Yellow
Write-Host ""

# Generar cliente de Prisma
Write-Host "[1/2] Generando cliente de Prisma..." -ForegroundColor Cyan
$generateOutput = npx prisma generate 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] Cliente generado" -ForegroundColor Green
} else {
    Write-Host "  [ERROR] Fallo al generar cliente" -ForegroundColor Red
    Write-Host $generateOutput
    Read-Host "Presiona Enter para cerrar"
    exit 1
}

Write-Host ""

# Push schema a la base de datos
Write-Host "[2/2] Aplicando cambios al esquema..." -ForegroundColor Cyan
$pushOutput = npx prisma db push 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] Esquema actualizado" -ForegroundColor Green
} else {
    Write-Host "  [WARNING] Posible error al actualizar" -ForegroundColor Yellow
    Write-Host $pushOutput
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Base de Datos Actualizada!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "Nuevas tablas disponibles:" -ForegroundColor Cyan
Write-Host "  - Tag (Sistema de etiquetas)" -ForegroundColor White
Write-Host "  - QuickReply (Respuestas rapidas)" -ForegroundColor White
Write-Host "  - ScheduledMessage (Mensajes programados)" -ForegroundColor White
Write-Host "  - AIConfig (Configuracion de IA)" -ForegroundColor White
Write-Host ""

Write-Host "Reiniciando servidor Next.js..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'Next.js Server - Puerto 7847' -ForegroundColor Green; npm run dev"

Write-Host ""
Write-Host "Esperando a que el servidor inicie..." -ForegroundColor Gray
Start-Sleep -Seconds 8

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Sistema Actualizado y Listo!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Paneles disponibles:" -ForegroundColor Cyan
Write-Host "  - Analytics:      http://localhost:7847/admin/analytics" -ForegroundColor White
Write-Host "  - Quick Replies:  http://localhost:7847/admin/quick-replies" -ForegroundColor White
Write-Host "  - Tags:           http://localhost:7847/admin/tags" -ForegroundColor White
Write-Host "  - AI Config:      http://localhost:7847/admin/ai" -ForegroundColor White
Write-Host "  - Scheduled:      http://localhost:7847/admin/scheduled" -ForegroundColor White
Write-Host ""

Read-Host "Presiona Enter para cerrar"
