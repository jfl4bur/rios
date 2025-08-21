<#
run_migrations.ps1

Automatiza:
- backup del fichero SQLite
- aplicar archivos SQL en backend/migrations (ordenados)
- ejecutar scripts post-migra opcionales
- registrar salida en backend/migrations/run_migrations.log

Uso:
pwsh -NoProfile -File run_migrations.ps1 -DbPath "backend/data.sqlite" -RunPostScripts
#>
param(
  [string]$DbPath = "backend/data.sqlite",
  [switch]$RunPostScripts,
  [string]$LogFile = "backend/migrations/run_migrations.log"
)

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
