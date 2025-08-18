# Crea logs y lanza `npm run dev` en background redirigiendo stdout/stderr a logs\dev.log
$frontendDir = Resolve-Path (Join-Path $PSScriptRoot '..')
$logsDir = Join-Path $frontendDir 'logs'
New-Item -Path $logsDir -ItemType Directory -Force | Out-Null
$logFile = Join-Path $logsDir 'dev.log'

Write-Output "Starting frontend dev in background. Logs -> $logFile"
$cmd = "Set-Location -LiteralPath '$frontendDir'; npm run dev *> '$logFile' 2>&1"
$proc = Start-Process -FilePath 'pwsh.exe' -ArgumentList '-NoProfile','-Command',$cmd -WindowStyle Hidden -PassThru
Write-Output "Started PID: $($proc.Id)"
Write-Output "Waiting 2s and showing last lines of the log..."
Start-Sleep -Seconds 2
if (Test-Path $logFile) {
    Get-Content $logFile -Tail 80 -ErrorAction SilentlyContinue | ForEach-Object { Write-Output $_ }
} else {
    Write-Output "Log file not created yet: $logFile"
}
