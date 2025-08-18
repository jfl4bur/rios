param(
    [int]$WaitForReadySeconds = 6
)

Set-StrictMode -Version Latest

Write-Output "Start script: start_backend_debug.ps1 (wait $WaitForReadySeconds s)"

# directorio del script y padre (backend)
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$backendDir = (Resolve-Path (Join-Path $scriptDir '..')).Path
Set-Location $backendDir

Write-Output "Working dir (backend): $backendDir"

# Stop existing node processes (safe)
Write-Output "Stopping existing node processes (if any)..."
Get-Process -Name node -ErrorAction SilentlyContinue | ForEach-Object {
    try { Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue; Write-Output "Stopped PID $_.Id" } catch { }
}

# Ensure logs directory
if (-not (Test-Path (Join-Path $backendDir 'logs'))) { New-Item -Path (Join-Path $backendDir 'logs') -ItemType Directory | Out-Null }

$logsDir = Join-Path $backendDir 'logs'
$log = Join-Path $logsDir 'backend_run_auto.log'
$errLog = Join-Path $logsDir 'backend_run_auto.err.log'
if (Test-Path $log) { Remove-Item $log -Force }

# Find node executable
$nodePath = (where.exe node | Select-Object -First 1) -replace "`r",""
if (-not $nodePath) { Write-Error "node executable not found in PATH"; exit 2 }
Write-Output "Node path: $nodePath"

Write-Output "Starting node index.js in background. Redirecting stdout/stderr to $log"
try {
    $proc = Start-Process -FilePath $nodePath -ArgumentList 'index.js' -WorkingDirectory $backendDir -RedirectStandardOutput $log -RedirectStandardError $errLog -PassThru -ErrorAction Stop
} catch {
    Write-Output "Start-Process falló: $($_.Exception.Message)"
    $proc = $null
}

Start-Sleep -Seconds $WaitForReadySeconds

if ($proc) { Write-Output "Started PID: $($proc.Id)" } else { Write-Output 'No se pudo iniciar el proceso node.' }

if (Test-Path $log) {
    Write-Output "=== Últimas 150 líneas de $log ==="
    Get-Content $log -Tail 150 | ForEach-Object { Write-Output $_ }
} else {
    Write-Output "Log no encontrado: $log"
}

# Buscar puerto en el log
$listenLine = $null
if (Test-Path $log) {
    $listenLine = Select-String -Path $log -Pattern 'Backend escuchando en puerto|listening on port|Backend listening on port' -SimpleMatch -ErrorAction SilentlyContinue | Select-Object -First 1
}

if ($listenLine) {
    $line = $listenLine.Line
    Write-Output "Detected line: $line"
    if ($line -match '(\\d{2,5})') { $port = $matches[0] } else { $port = 'unknown' }
    Write-Output "Servidor parece escuchar en el puerto: $port"
    try {
        $res = Invoke-WebRequest -UseBasicParsing -Uri "http://localhost:$port/" -TimeoutSec 5
        Write-Output "Health check OK: $($res.Content)"
    } catch {
        Write-Output "Health check fallo: $($_.Exception.Message)"
    }
} else {
    Write-Output "No se detectó la línea de escucha en el log. Buscando listeners con netstat (3090/9000/PID)..."
    netstat -ano | Select-String 'LISTENING' | Select-String '3090|9000' -AllMatches | ForEach-Object { Write-Output $_.Line }
    Write-Output "Listado completo de LISTENING (puede ser largo):"; netstat -ano | Select-String 'LISTENING' | ForEach-Object { Write-Output $_.Line }
}

if ($proc) {
    Write-Output "Para detener el servidor ejecuta: Stop-Process -Id $($proc.Id) -Force"
} else {
    Write-Output "No hay proceso para detener (start falló). Revisa $errLog para stderr." 
}
