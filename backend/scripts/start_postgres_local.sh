#!/usr/bin/env bash
# Start a local Postgres for development using docker-compose
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../infra/docker/postgres" && pwd)"
cd "$DIR"

echo "Starting local Postgres via docker-compose..."

docker compose -f docker-compose.postgres.yml up -d

echo "Postgres started (container may be named ${PWD##*/}_db). Set DATABASE_URL=postgres://rios:rios@localhost:5432/rios_dev"
