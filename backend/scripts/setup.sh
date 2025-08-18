#!/usr/bin/env bash
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ ! -d node_modules ]; then
  echo "Installing npm packages..."
  npm install
else
  echo "node_modules present"
fi

mkdir -p uploads logs data
DB="$ROOT/data/rios.db"
if [ ! -f "$DB" ]; then
  echo "Creating sqlite db file"
  touch "$DB"
else
  echo "DB exists: $DB"
fi

echo "Setup complete. Run: npm run dev"
