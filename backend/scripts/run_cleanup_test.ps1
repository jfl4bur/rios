param(
  [int]$Days = 7,
  [string]$Webhook = $env:CLEANUP_WEBHOOK_URL,
  [switch]$SkipConfirm
)

# Directorios
$backend = (Join-Path $PSScriptRoot '..')
$uploads = Join-Path $backend 'uploads'

Write-Output "Backend root: $backend"

if (-not (Test-Path $uploads)) {
  Write-Output "Creando carpeta uploads en: $uploads"
  New-Item -ItemType Directory -Path $uploads | Out-Null
}

$testFile = Join-Path $uploads 'test-old-webhook.txt'
Write-Output "Creando fichero de prueba: $testFile"
Set-Content -Path $testFile -Value "webhook test"

# Envejecer a 30 días atrás para que sea candidato
(Get-Item $testFile).LastWriteTime = (Get-Date).AddDays(-30)

Write-Output "--- Archivo creado y envejecido ---"
Get-Item $testFile | Select-Object FullName,Length,LastWriteTime | Format-List

if (-not $Webhook) {
  $Webhook = 'https://httpbin.org/post'
  Write-Output "No se proporcionó CLEANUP_WEBHOOK_URL; usando webhook de prueba: $Webhook"
} else {
  Write-Output "Usando webhook desde entorno: $Webhook"
}

Write-Output "\n=== Ejecutando dry-run (no borrará archivos) ==="
$env:CLEANUP_WEBHOOK_URL = $Webhook
Push-Location $backend
try {
  & node .\scripts\cleanup_uploads.js --days=$Days --dry-run
} finally {
  Pop-Location
}

if (-not $SkipConfirm) {
  $ans = Read-Host "\n¿Deseas proceder con la ejecución real que eliminará archivos? (Y/N)"
  if ($ans -notin @('Y','y','S','s')) {
    Write-Output "Aborto: no se realizó la eliminación. Revisa los logs en .\logs\cleanup.log"
    exit 0
  }
}

Write-Output "\n=== Ejecutando limpieza REAL ahora (se eliminarán archivos) ==="
Push-Location $backend
try {
  & node .\scripts\cleanup_uploads.js --days=$Days
} finally {
  Pop-Location
}

Write-Output "Ejecución finalizada. Comprueba .\logs\cleanup.log para detalles y la notificación webhook." 
