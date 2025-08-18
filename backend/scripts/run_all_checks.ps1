# Run a battery of checks for the backend project
Write-Output "Running backend checks..."
$cwd = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $cwd\..\

Write-Output "1) Node version"
node -v

Write-Output "2) npm install (dev dependencies may be required)"
if (Test-Path node_modules) { Write-Output "node_modules present" } else { Write-Output "node_modules missing - run 'npm install' in backend'" }

Write-Output "3) Run smoke tests"
node tests/test_basic.js

Write-Output "4) Env loader test"
node tests/test_env_loader.js

Write-Output "Checks finished"
