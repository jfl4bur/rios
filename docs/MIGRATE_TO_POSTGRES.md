# Plan de migración a PostgreSQL

## Objetivo
Proveer una guía y artefactos mínimos para migrar la base de datos de desarrollo/CI de SQLite a PostgreSQL.

## Alcance inicial
- Añadir un `docker-compose` para correr Postgres localmente.
- Documentar variables de entorno y pasos de migración.
- Proveer un script de arranque local para desarrolladores.
- Esbozar los pasos de CI para ejecutar tests contra Postgres.

## Pasos recomendados (mínimos)
1. Añadir `DATABASE_URL` en `backend` y soportarla en la capa de conexión (p. ej. usar `process.env.DATABASE_URL`).
2. Crear `infra/docker/postgres/docker-compose.postgres.yml` con volumen persistente y credenciales por defecto para desarrollo.
3. Añadir script `backend/scripts/start_postgres_local.sh` que levante el contenedor.
4. Adaptar las migraciones: crear scripts SQL para crear tablas equivalentes a las de SQLite (ver `backend/scripts/create_test_db.js`).
5. Actualizar CI: añadir job matrix que ejecute tests contra SQLite y contra Postgres (usando service container o Docker Compose).
6. Probar localmente: correr `start_postgres_local.sh`, apuntar `DATABASE_URL` del backend y ejecutar tests.

## Checklist técnico
- [ ] Soportar `DATABASE_URL` en backend
- [ ] Docker Compose para Postgres (`infra/docker/postgres/docker-compose.postgres.yml`)
- [ ] Script de arranque local: `backend/scripts/start_postgres_local.sh`
- [ ] Documentación de rollback y backup/restore (dump/restore)
- [ ] CI job que use Postgres y valide integraciones

## Notas
Mantener SQLite como opción ligera para desarrollos rápidos y para pruebas unitarias muy aisladas; usar Postgres como la fuente de verdad para staging/producción.
