# Run quick checks from repo root regardless of current directory
# Usage: pwsh -NoProfile -File .\run_checks.ps1
try {
  $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
  $repoRoot = Resolve-Path $scriptDir
  Write-Output "Repo root: $repoRoot"

  $show = Join-Path $repoRoot 'backend\scripts\show_notify_state.ps1'
  if (Test-Path $show) {
    Write-Output "Running show_notify_state.ps1..."
    pwsh -NoProfile -File $show
  } else {
    Write-Output "Missing: $show"
  }

  $cleanup = Join-Path $repoRoot 'backend\scripts\cleanup_uploads.js'
  if (Test-Path $cleanup) {
    Write-Output "Running cleanup_uploads.js --test-notify (safe test)..."
    # Run Node directly to avoid batch path mistakes
    $proc = Start-Process -FilePath node -ArgumentList "$cleanup --days=1 --test-notify" -NoNewWindow -Wait -PassThru -RedirectStandardOutput "$pwd\backend\logs\run_checks_output.log" -RedirectStandardError "$pwd\backend\logs\run_checks_error.log"
    if ($proc.ExitCode -ne 0) {
      Write-Output "cleanup_uploads.js exited with code $($proc.ExitCode). See backend\logs\run_checks_error.log and run_checks_output.log"
    } else {
      Write-Output "cleanup_uploads.js completed successfully"
    }
  } else {
    Write-Output "Missing: $cleanup"
  }
} catch {
  Write-Error $_.Exception.Message
  exit 1
}
