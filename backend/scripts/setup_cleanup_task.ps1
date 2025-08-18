<#
Automatiza la creación/registro de la tarea programada RiosCleanupUploads.
Uso: ejecutar desde PowerShell (pwsh). El script se elevará automáticamente pidiendo UAC.

Parámetros:
 -CleanupDays <int>   Dias umbral (por defecto 1)
 -DryRun             Switch: registrar en modo dry-run (no borra archivos)
 -RunNow             Switch: forzar ejecución inmediatamente tras registrar

Ejemplo:
 pwsh -NoProfile -File .\setup_cleanup_task.ps1 -CleanupDays 1 -DryRun -RunNow
#>
[CmdletBinding()]
param(
  [int]$CleanupDays = 1,
  [switch]$DryRun,
  [switch]$RunNow
)

function Test-IsElevated {
  try {
    $wi = [Security.Principal.WindowsIdentity]::GetCurrent()
    $wp = New-Object Security.Principal.WindowsPrincipal($wi)
    return $wp.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
  } catch { return $false }
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$regScript = Join-Path $scriptDir 'register_cleanup_task.ps1'
$taskName = 'RiosCleanupUploads'

if (-not (Test-Path $regScript)) {
  Write-Error "No se encontró $regScript. Ejecuta este script desde la carpeta scripts del repo."
  exit 1
}

# Si no estamos elevados, relanzamos el registro elevado (UAC) y salimos
if (-not (Test-IsElevated)) {
  Write-Output "No estás en una sesión elevada: se solicitará UAC para crear/modificar la tarea como SYSTEM..."
  $args = @('-NoProfile','-ExecutionPolicy','Bypass','-File',"$regScript","-CleanupDays",$CleanupDays)
  if ($DryRun) { $args += '-CleanupDryRun' }
  try {
    Start-Process -FilePath pwsh -ArgumentList $args -Verb RunAs -Wait
    Write-Output 'Registro completado (proceso elevado terminó). Ahora verificaré el estado de la tarea.'
  } catch {
    Write-Error "No se pudo elevar el proceso para crear la tarea: $_"
    exit 1
  }
} else {
  # Ya elevados: ejecutar directamente el script de registro
  $callArgs = @()
  $callArgs += '-CleanupDays'; $callArgs += $CleanupDays
  if ($DryRun) { $callArgs += '-CleanupDryRun' }
  Write-Output "Ejecutando: register_cleanup_task.ps1 $($callArgs -join ' ')"
  try {
    & pwsh -NoProfile -File $regScript @callArgs
  } catch {
    Write-Error "Fallo al ejecutar register_cleanup_task.ps1: $_"
    exit 1
  }
}

Start-Sleep -Seconds 1

# Verificar tarea
Write-Output "--- Estado de la tarea programada ($taskName) ---"
try {
  schtasks /Query /TN "$taskName" /V /FO LIST | Write-Output
} catch {
  Write-Warning "No se pudo consultar la tarea con schtasks: $_"
}

# Si el usuario pidió ejecutar ahora, lo hacemos y mostramos el log
if ($RunNow) {
  Write-Output "Forzando ejecución de la tarea $taskName..."
  try {
    schtasks /Run /TN "$taskName" | Out-Null
  } catch {
    Write-Warning "No se pudo ejecutar la tarea: $_"
  }
  Start-Sleep -Seconds 5
}

# Mostrar últimas líneas del log de limpieza
$log = Join-Path (Join-Path $scriptDir '..') 'logs' 'cleanup.log'
if (Test-Path $log) {
  Write-Output "--- Últimas líneas de $log ---"
  Get-Content $log -Tail 120 | Write-Output
} else {
  Write-Output "Log no encontrado en: $log"
}

Write-Output 'Hecho. Si aceptaste UAC, la tarea debería estar registrada como SYSTEM y usar el wrapper que carga cleanup-notify.env (si existe).'
