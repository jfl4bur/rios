# Start backend and frontend dev servers in separate PowerShell windows
# Usage: pwsh -NoProfile -File .\dev_start.ps1
param(
  [int]$BackendPort = 9000,
  [int]$FrontendPort = 5173
)

$repo = Split-Path -Parent $MyInvocation.MyCommand.Definition
$backendDir = Join-Path $repo 'backend'
$frontendDir = Join-Path $repo 'frontend-admin'

Write-Output "Starting backend in new window (dir: $backendDir)"
Start-Process -FilePath pwsh -ArgumentList "-NoProfile -NoExit -Command cd '$backendDir'; npm install; npm run dev" -WindowStyle Normal

Start-Sleep -Seconds 2
Write-Output "Starting frontend in new window (dir: $frontendDir)"
Start-Process -FilePath pwsh -ArgumentList "-NoProfile -NoExit -Command cd '$frontendDir'; npm install; npm run dev" -WindowStyle Normal

Write-Output "Dev servers should be starting. Wait a few seconds and run the integration check:"
Write-Output "  node integration_check.js --backend http://localhost:$BackendPort --frontend http://localhost:$FrontendPort"
