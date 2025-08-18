# One-shot helper: install, start backend/frontend in new windows, run integration check and capture output
# Usage: pwsh -NoProfile -File .\local_all_in_one.ps1
try {
  $repo = Split-Path -Parent $MyInvocation.MyCommand.Definition
  Set-Location $repo

  Write-Output "1) Installing dependencies (backend + frontend)..."
  npm run install:all

  Write-Output "2) Starting backend (new window)..."
  $backendDir = Join-Path $repo 'backend'
  Start-Process -FilePath pwsh -ArgumentList "-NoProfile -NoExit -Command cd '$backendDir'; npm run dev" -WindowStyle Minimized

  Start-Sleep -Seconds 2
  Write-Output "3) Starting frontend (new window)..."
  $frontendDir = Join-Path $repo 'frontend-admin'
  Start-Process -FilePath pwsh -ArgumentList "-NoProfile -NoExit -Command cd '$frontendDir'; npm run dev" -WindowStyle Minimized

  Write-Output "Waiting 10s for servers to start..."
  Start-Sleep -Seconds 10

  Write-Output "4) Running integration check and saving output to backend/logs/integration_check_output.log"
  $outLog = Join-Path $repo 'backend\logs\integration_check_output.log'
  $errLog = Join-Path $repo 'backend\logs\integration_check_error.log'
  if (!(Test-Path (Join-Path $repo 'backend\logs'))) { New-Item -ItemType Directory -Path (Join-Path $repo 'backend\logs') | Out-Null }
  try {
    node ./integration_check.js --backend http://localhost:9000 --frontend http://localhost:5173 > $outLog 2> $errLog
    Write-Output "Integration check finished. Output: $outLog  Error: $errLog"
    Get-Content $outLog -Raw
  } catch {
    Write-Output "Integration check failed. See logs: $outLog and $errLog"
  }

  Write-Output "Done. If something fails, paste the contents of the logs here and lo reviso."
} catch {
  Write-Error $_.Exception.Message
  exit 1
}
