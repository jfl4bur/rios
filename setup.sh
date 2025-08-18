#!/usr/bin/env bash
set -e
echo "Setup para Prompt Maestro — Rutas, Ríos y Senderismo"

if ! command -v node >/dev/null 2>&1; then
  echo "Node no encontrado. Instala Node.js: https://nodejs.org/"
else
  echo "Node: $(node -v)"
fi

if ! command -v flutter >/dev/null 2>&1; then
  echo "Flutter no encontrado. Instala Flutter: https://flutter.dev/docs/get-started/install"
else
  echo "Flutter: $(flutter --version | head -n1)"
fi

echo "Instalando dependencias backend..."
cd backend
npm install || true
cd ..

echo "Instalando dependencias frontend-admin..."
cd frontend-admin
npm install || true
cd ..

echo "Setup básico completado. Revisa config/config.json y variables de entorno antes de ejecutar servicios."

# Run migrations (optional)
if [ -f backend/scripts/run_migrations.js ]; then
  echo "Aplicando migraciones SQLite..."
  node backend/scripts/run_migrations.js || true
fi

echo "Coloca las credenciales de Firebase en variables de entorno o en backend/.env si las usas."
