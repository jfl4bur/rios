<# 
# run_migrations.ps1
# Simple PowerShell helper to create a timestamped backup of the sqlite DB and apply SQL
# migration files found under backend/migrations in lexical order.
#
# Usage:
#   pwsh -NoProfile -File backend/scripts/run_migrations.ps1 -DbPath "backend/data.sqlite" [-DryRun]
#
# Options:
#   -DbPath   : Path to sqlite DB file (required)
#   -DryRun   : If present, only lists the SQL files that would be applied
param(
  [Parameter(Mandatory=$true)]
  [string]$DbPath,

  [switch]$DryRun
)

function Write-Log($msg) { Write-Output "[run_migrations] $msg" }

if (-not (Test-Path $DbPath)) {
  Write-Log "DB file not found: $DbPath"
  exit 1
}

$ts = Get-Date -Format "yyyyMMdd_HHmmss"
$backup = "${DbPath}.${ts}.bak"
Copy-Item -Path $DbPath -Destination $backup -Force
Write-Log "Backup creado: $backup"

$migrationsDir = Join-Path -Path (Split-Path -Parent $MyInvocation.MyCommand.Definition) -ChildPath "..\migrations"
$migrationsDir = (Resolve-Path $migrationsDir).Path

if (-not (Test-Path $migrationsDir)) {
  Write-Log "No se encontró carpeta de migraciones en: $migrationsDir"
  exit 0
}

$sqlFiles = Get-ChildItem -Path $migrationsDir -Filter "*.sql" | Sort-Object Name
if ($sqlFiles.Length -eq 0) {
  Write-Log "No hay archivos .sql en $migrationsDir"
  exit 0
}

Write-Log "Encontrados $($sqlFiles.Length) archivos de migración"
foreach ($f in $sqlFiles) {
  Write-Log "-> $($f.Name)"
}

if ($DryRun) {
  Write-Log "DryRun activado: no se aplicarán migraciones"
  exit 0
}

foreach ($f in $sqlFiles) {
  Write-Log "Aplicando $($f.Name) contra $DbPath"
  & sqlite3 "$DbPath" ".read $($f.FullName)" 2>&1 | ForEach-Object { Write-Output $_ }
  if ($LASTEXITCODE -ne 0) {
    Write-Log "Error aplicando $($f.Name); abortando"
    exit 2
  }
}

Write-Log "Migraciones aplicadas con éxito"
exit 0

function Write-Log {
  param([string]$msg)
  $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  $line = "[$ts] $msg"
  $line | Tee-Object -FilePath $LogFile -Append
}

if (-not (Test-Path $DbPath)) {
  Write-Host "DB file not found: $DbPath" -ForegroundColor Red
  exit 1
}

# Crear backup
$ts = Get-Date -Format "yyyyMMdd_HHmmss"
$backup = "${DbPath}.${ts}.bak"
Copy-Item -Path $DbPath -Destination $backup -Force
Write-Log "Backup creado: $backup"
Write-Host "Backup creado: $backup"

# Aplicar migraciones SQL en orden
$files = Get-ChildItem -Path "backend/migrations" -Filter "*.sql" | Sort-Object Name
if ($files.Count -eq 0) {
  Write-Log "No se encontraron archivos SQL en backend/migrations"
  Write-Host "No hay migraciones para aplicar."
  exit 0
}

foreach ($f in $files) {
  Write-Log "Aplicando migración: $($f.Name)"
  Write-Host "Aplicando: $($f.FullName)"
  $cmd = "sqlite3 `"$DbPath`" `.read $($f.FullName)`"
  try {
    Invoke-Expression $cmd
    Write-Log "Aplicada: $($f.Name)"
  } catch {
    Write-Log "ERROR aplicando $($f.Name): $_"
    Write-Host "ERROR aplicando $($f.Name): $_" -ForegroundColor Red
    Write-Log "Restaurando backup: $backup"
    Copy-Item -Path $backup -Destination $DbPath -Force
    Write-Host "DB restaurada desde backup: $backup" -ForegroundColor Yellow
    exit 1
  }
}

# Ejecutar scripts post-migra si es necesario
if ($RunPostScripts) {
  Write-Log "Ejecutando scripts post-migra"
  # Añade scripts específicos aquí si los tienes
  $post = @(
    "backend/scripts/populate_lat_lng.js"
  )
  foreach ($s in $post) {
    if (Test-Path $s) {
      Write-Log "Ejecutando: $s"
      try {
        node $s --db $DbPath | ForEach-Object { Write-Log $_ }
        Write-Log "Ejecutado: $s"
      } catch {
        Write-Log "ERROR ejecutando $s: $_"
      }
    } else {
      Write-Log "Script no encontrado: $s"
    }
  }
}

Write-Log "Migraciones completadas con éxito"
Write-Host "Migraciones completadas con éxito"
