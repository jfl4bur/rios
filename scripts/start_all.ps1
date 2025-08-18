# Inicia backend y frontend en dos ventanas de PowerShell separadas (no cierran)
$root = Split-Path -Path $MyInvocation.MyCommand.Path -Parent
$backend = Join-Path $root "..\backend" | Resolve-Path -Relative
$frontend = Join-Path $root "..\frontend-admin" | Resolve-Path -Relative
Write-Output "Starting backend in new terminal: $backend"
Start-Process -FilePath "pwsh.exe" -ArgumentList "-NoExit", "-Command", "Set-Location -LiteralPath '$backend'; npm run dev"
Write-Output "Starting frontend in new terminal: $frontend"
Start-Process -FilePath "pwsh.exe" -ArgumentList "-NoExit", "-Command", "Set-Location -LiteralPath '$frontend'; npm run dev"
