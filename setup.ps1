# Setup script para Windows (PowerShell)
Write-Host "Setup iniciado para Prompt Maestro — Rutas, Ríos y Senderismo"

# 1) Comprobar Node
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host "Node.js no encontrado. Por favor instala Node.js desde https://nodejs.org/" -ForegroundColor Yellow
} else {
  Write-Host "Node detectado: $(node -v)"
}

# 2) Comprobar Flutter
if (-not (Get-Command flutter -ErrorAction SilentlyContinue)) {
  Write-Host "Flutter no encontrado. Instala Flutter: https://flutter.dev/docs/get-started/install" -ForegroundColor Yellow
} else {
  Write-Host "Flutter detectado: $(flutter --version | Select-String 'Flutter')"
}

# 3) Instalar dependencias backend
Push-Location backend
if (Test-Path package.json) {
  Write-Host "Instalando dependencias backend..."
  npm install
} else { Write-Host "No se encontró package.json en backend" }
Pop-Location

# 4) Instalar dependencias frontend admin
Push-Location frontend-admin
if (Test-Path package.json) {
  Write-Host "Instalando dependencias frontend-admin..."
  npm install
} else { Write-Host "No se encontró package.json en frontend-admin" }
Pop-Location

Write-Host "Setup básico completado. Edita config/config.json y las variables de entorno antes de iniciar servicios." -ForegroundColor Green
# Ejecutar migraciones SQLite (opcional)
if (Get-Command pwsh -ErrorAction SilentlyContinue) {
  Write-Host "Aplicando migraciones de backend..."
  Push-Location backend
  if (Test-Path .\scripts\run_migrations.js) {
    node .\scripts\run_migrations.js
  }
  Pop-Location
}

Write-Host "Si quieres, coloca las credenciales de Firebase en variables de entorno o en backend/.env" -ForegroundColor Yellow
