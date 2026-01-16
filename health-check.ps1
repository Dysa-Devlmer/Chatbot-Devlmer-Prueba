# ═══════════════════════════════════════════════════════════════
# HEALTH CHECK - Sistema Chatbot Devlmer
# ═══════════════════════════════════════════════════════════════
# Ejecutar antes de cada sesión para verificar estado del sistema
# Uso: .\health-check.ps1

Write-Host "`n═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  HEALTH CHECK - Chatbot Devlmer System" -ForegroundColor Cyan
Write-Host "  Fecha: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

# 1. GIT STATUS
Write-Host "📦 GIT STATUS" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor DarkGray

$currentBranch = git branch --show-current
$gitStatus = git status --short
$lastCommit = git log -1 --format="%h - %s"

Write-Host "Repository: " -NoNewline -ForegroundColor White
Write-Host "Dysa-Devlmer/Chatbot-Devlmer" -ForegroundColor Green

Write-Host "Branch:     " -NoNewline -ForegroundColor White
Write-Host "$currentBranch" -ForegroundColor Green

Write-Host "Last Commit:" -NoNewline -ForegroundColor White
Write-Host " $lastCommit" -ForegroundColor Green

if ([string]::IsNullOrWhiteSpace($gitStatus)) {
    Write-Host "Status:     " -NoNewline -ForegroundColor White
    Write-Host "✅ Clean (no changes)" -ForegroundColor Green
} else {
    Write-Host "Status:     " -NoNewline -ForegroundColor White
    Write-Host "⚠️  Changes detected:" -ForegroundColor Yellow
    Write-Host $gitStatus -ForegroundColor Yellow
}

# Verificar si está sincronizado con remote
$gitRemote = git fetch origin 2>&1
$behindAhead = git rev-list --left-right --count origin/$currentBranch...$currentBranch 2>&1
if ($behindAhead -match "(\d+)\s+(\d+)") {
    $behind = $matches[1]
    $ahead = $matches[2]

    if ($behind -eq "0" -and $ahead -eq "0") {
        Write-Host "Remote:     " -NoNewline -ForegroundColor White
        Write-Host "✅ Synchronized with GitHub" -ForegroundColor Green
    } else {
        if ($behind -gt 0) {
            Write-Host "Remote:     " -NoNewline -ForegroundColor White
            Write-Host "⚠️  Behind by $behind commits (need to pull)" -ForegroundColor Yellow
        }
        if ($ahead -gt 0) {
            Write-Host "Remote:     " -NoNewline -ForegroundColor White
            Write-Host "⚠️  Ahead by $ahead commits (need to push)" -ForegroundColor Yellow
        }
    }
}

Write-Host ""

# 2. PM2 SERVICES
Write-Host "🚀 PM2 SERVICES" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor DarkGray

$pm2List = pm2 jlist | ConvertFrom-Json

if ($pm2List) {
    foreach ($proc in $pm2List) {
        $name = $proc.name
        $status = $proc.pm2_env.status
        $uptime = $proc.pm2_env.pm_uptime
        $restarts = $proc.pm2_env.restart_time
        $memory = [math]::Round($proc.monit.memory / 1MB, 1)
        $cpu = $proc.monit.cpu

        # Calcular uptime legible
        if ($uptime) {
            $uptimeSpan = New-TimeSpan -Start ([DateTimeOffset]::FromUnixTimeMilliseconds($uptime).DateTime) -End (Get-Date)
            if ($uptimeSpan.TotalHours -ge 1) {
                $uptimeStr = "{0}h {1}m" -f [math]::Floor($uptimeSpan.TotalHours), $uptimeSpan.Minutes
            } else {
                $uptimeStr = "{0}m" -f [math]::Floor($uptimeSpan.TotalMinutes)
            }
        } else {
            $uptimeStr = "N/A"
        }

        Write-Host ("[{0}] " -f $name.PadRight(20)) -NoNewline -ForegroundColor White

        if ($status -eq "online") {
            Write-Host "✅ ONLINE  " -NoNewline -ForegroundColor Green
        } else {
            Write-Host "❌ OFFLINE " -NoNewline -ForegroundColor Red
        }

        Write-Host ("| Uptime: {0} | Restarts: {1} | Mem: {2}MB | CPU: {3}%" -f $uptimeStr.PadRight(8), $restarts, $memory, $cpu) -ForegroundColor Gray
    }
} else {
    Write-Host "❌ No PM2 processes found" -ForegroundColor Red
}

Write-Host ""

# 3. NETWORK AND PORTS
Write-Host "NETWORK AND PORTS" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor DarkGray

# Verificar puerto 7847 (Chatbot)
$port7847 = Get-NetTCPConnection -LocalPort 7847 -State Listen -ErrorAction SilentlyContinue
if ($port7847) {
    Write-Host "Port 7847:  " -NoNewline -ForegroundColor White
    Write-Host "✅ Listening (Chatbot)" -ForegroundColor Green
} else {
    Write-Host "Port 7847:  " -NoNewline -ForegroundColor White
    Write-Host "❌ Not listening" -ForegroundColor Red
}

# Verificar puerto 11434 (Ollama)
$port11434 = Get-NetTCPConnection -LocalPort 11434 -State Listen -ErrorAction SilentlyContinue
if ($port11434) {
    Write-Host "Port 11434: " -NoNewline -ForegroundColor White
    Write-Host "✅ Listening (Ollama)" -ForegroundColor Green
} else {
    Write-Host "Port 11434: " -NoNewline -ForegroundColor White
    Write-Host "❌ Not listening" -ForegroundColor Red
}

# Test Cloudflare tunnel
Write-Host "Cloudflare: " -NoNewline -ForegroundColor White
try {
    $response = Invoke-WebRequest -Uri "https://chatbot.zgamersa.com" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    Write-Host "✅ Accessible (https://chatbot.zgamersa.com)" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Not accessible or slow" -ForegroundColor Yellow
}

Write-Host ""

# 4. SYSTEM RESOURCES
Write-Host "💻 SYSTEM RESOURCES" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor DarkGray

$cpu = Get-CimInstance Win32_Processor | Measure-Object -Property LoadPercentage -Average | Select-Object -ExpandProperty Average
$mem = Get-CimInstance Win32_OperatingSystem
$memUsed = [math]::Round(($mem.TotalVisibleMemorySize - $mem.FreePhysicalMemory) / 1MB, 1)
$memTotal = [math]::Round($mem.TotalVisibleMemorySize / 1MB, 1)
$memPercent = [math]::Round(($memUsed / $memTotal) * 100, 1)

Write-Host "CPU Usage:  " -NoNewline -ForegroundColor White
if ($cpu -lt 70) {
    Write-Host "$cpu% ✅" -ForegroundColor Green
} elseif ($cpu -lt 90) {
    Write-Host "$cpu% ⚠️" -ForegroundColor Yellow
} else {
    Write-Host "$cpu% ❌" -ForegroundColor Red
}

Write-Host "Memory:     $memUsed GB / $memTotal GB" -NoNewline -ForegroundColor White
if ($memPercent -lt 70) {
    Write-Host " OK" -ForegroundColor Green
} elseif ($memPercent -lt 90) {
    Write-Host " Warning" -ForegroundColor Yellow
} else {
    Write-Host " Critical" -ForegroundColor Red
}

Write-Host ""

# 5. CONFIGURATION FILES
Write-Host "⚙️  CONFIGURATION FILES" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor DarkGray

$configFiles = @(
    "ecosystem.config.js",
    "cloudflared-config.yml",
    ".env",
    "package.json",
    "prisma\schema.prisma"
)

foreach ($file in $configFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file" -ForegroundColor Green
    } else {
        Write-Host "❌ $file (missing)" -ForegroundColor Red
    }
}

Write-Host ""

# 6. SUMMARY
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  SUMMARY" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan

$totalChecks = 0
$passedChecks = 0

# Git check
$totalChecks++
if ([string]::IsNullOrWhiteSpace($gitStatus)) { $passedChecks++ }

# PM2 checks
foreach ($proc in $pm2List) {
    $totalChecks++
    if ($proc.pm2_env.status -eq "online") { $passedChecks++ }
}

# Port checks
$totalChecks += 2
if ($port7847) { $passedChecks++ }
if ($port11434) { $passedChecks++ }

$healthPercentage = [math]::Round(($passedChecks / $totalChecks) * 100)

Write-Host "`nSystem Health: " -NoNewline -ForegroundColor White
if ($healthPercentage -ge 90) {
    Write-Host "$healthPercentage% ✅ EXCELLENT" -ForegroundColor Green
} elseif ($healthPercentage -ge 70) {
    Write-Host "$healthPercentage% ⚠️  GOOD" -ForegroundColor Yellow
} else {
    Write-Host "$healthPercentage% ❌ NEEDS ATTENTION" -ForegroundColor Red
}

Write-Host "Checks Passed: $passedChecks / $totalChecks`n" -ForegroundColor Gray

Write-Host "═══════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan
