<#
.SYNOPSIS
  Instala dependencias del backend y ejecuta los tests nativos de Node.

.DESCRIPTION
  Este script automatiza: comprobación de versiones, instalación de dependencias
  (npm ci, con fallback a npm install), ejecución de los tests del backend y
  captura de logs en un directorio temporal.

.EXAMPLE
  pwsh -NoProfile -File .\scripts\run_backend_tests.ps1
#>
param(
  [string]$BackendPath = 'backend'
)

function Fail([string]$msg){ Write-Error $msg; exit 1 }

Write-Output "Repository: $(Get-Location)"

Write-Output "Checking Node and npm versions..."
try {
  $node = (node -v) 2>$null
  $npm = (npm -v) 2>$null
} catch {
  Fail "node or npm not found in PATH. Install Node.js >= 18 and npm."
}
Write-Output "node: $node"
Write-Output "npm: $npm"

$logDir = Join-Path -Path ([System.IO.Path]::GetTempPath()) -ChildPath "rios_backend_test_logs"
New-Item -Path $logDir -ItemType Directory -Force | Out-Null
Write-Output "Logs will be written to: $logDir"

$installLog = Join-Path $logDir 'backend-install.log'
Write-Output "Installing backend dependencies (npm --prefix $BackendPath ci) -> $installLog"
try {
  npm --prefix $BackendPath ci 2>&1 | Tee-Object -FilePath $installLog
  $installCode = $LASTEXITCODE
} catch {
  $installCode = $LASTEXITCODE
}

if ($installCode -ne 0) {
  Write-Warning "npm ci failed (exit $installCode). Trying npm --prefix $BackendPath install"
  npm --prefix $BackendPath install 2>&1 | Tee-Object -FilePath $installLog
  $installCode = $LASTEXITCODE
  if ($installCode -ne 0) { Fail "Dependency installation failed. Revisa $installLog" }
}

Write-Output "Dependency installation succeeded."

$testLog = Join-Path $logDir 'backend-test.log'
Write-Output "Running backend tests (npm --prefix $BackendPath test) -> $testLog"
npm --prefix $BackendPath test 2>&1 | Tee-Object -FilePath $testLog
$testCode = $LASTEXITCODE

if ($testCode -ne 0) {
  Write-Error "Tests failed with exit code $testCode. Logs: $testLog"
  Write-Output "Tail of log (last 200 lines):"
  Get-Content $testLog -Tail 200 | Write-Output
  exit $testCode
}

Write-Output "Tests passed. Logs: $testLog"
Write-Output "Done. If you want to keep logs, copy them from: $logDir"
exit 0
