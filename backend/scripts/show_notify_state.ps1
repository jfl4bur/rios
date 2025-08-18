# Shows notify-state.json and latest smtp/webhook logs
$repo = Split-Path -Parent $MyInvocation.MyCommand.Definition
$logs = Join-Path $repo '..\logs'
$state = Join-Path $logs 'notify-state.json'
if (Test-Path $state) { Write-Output "Notify state:"; Get-Content $state -Raw } else { Write-Output "No notify-state.json found" }

Write-Output "\nLatest smtp-test JSON:"
Get-ChildItem -Path $logs -Filter 'smtp-test-*.json' -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1 | ForEach-Object { Get-Content $_.FullName -Raw }

Write-Output "\nLatest webhook JSON:"
Get-ChildItem -Path $logs -Filter 'webhook-*.json' -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1 | ForEach-Object { Get-Content $_.FullName -Raw }
