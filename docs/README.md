# Documentación del proyecto — Ríos

Bienvenido a la documentación oficial del proyecto Ríos. Este documento centraliza la información técnica y operativa necesaria para desarrolladores, mantenedores y colaboradores.

Tabla de contenido
- [Visión general](#visión-general)
- [Estructura del repositorio](#estructura-del-repositorio)
- [Instalación y arranque rápido](#instalación-y-arranque-rápido)
- [Arquitectura](#arquitectura)
- [API y contratos](#api-y-contratos)
- [Bases de datos y migraciones](#bases-de-datos-y-migraciones)
- [Multimedia y almacenamiento](#multimedia-y-almacenamiento)
- [Frontend admin](#frontend-admin)
- [Mobile](#mobile)
- [Scripts y utilidades](#scripts-y-utilidades)
- [Checklist maestro y estado](#checklist-maestro-y-estado)
- [Cómo contribuir](#cómo-contribuir)
- [Contacto y mantenimiento](#contacto-y-mantenimiento)

## Visión general

Proyecto multiplataforma para gestión de rutas, ríos y actividades de senderismo. Incluye:

- Backend en Node.js/Express para API REST.
- Frontend administrativo en React + Vite para moderación y gestión.
- Cliente móvil (esqueleto) en `mobile/`.
- Gestión de multimedia (subida, thumbnails, EXIF).

## Estructura del repositorio

Raíz principal:

- `backend/` — servidor Node.js, migraciones y seeds.
- `frontend-admin/` — panel administrativo en React.
- `mobile/` — app móvil (esqueleto).
- `docs/` — documentación (este archivo).
- `logs/` — archivos de logs y checklist maestro.
- `scripts/` — scripts de mantenimiento y regeneración de docs.

## Instalación y arranque rápido

Requisitos mínimos:

- Node.js 18+ y npm
- pwsh (PowerShell) en Windows para scripts incluidas

Backend (desarrollo):

```bash
cd backend
npm install
npm run dev
```

Frontend admin (desarrollo):

```bash
cd frontend-admin
npm install
npm run dev
```

Mobile: ver `mobile/README.md` (esqueleto).

## Arquitectura

Consulta `docs/ARCHITECTURE.md` para una descripción técnica completa y decisiones de diseño.

## API y contratos

Los endpoints principales están en el backend; documentación básica y ejemplos en `backend/README.md`.

Puntos clave:

- GET `/api/rios` — listado de rutas (paginado).
- POST `/api/rios` — creación de ruta con geometry y multimedia.
- CRUD `/api/comentarios` — sistema de comentarios.

Se recomienda añadir OpenAPI/Swagger en próximas iteraciones.

## Bases de datos y migraciones

Actualmente el entorno por defecto usa SQLite para facilitar setup local. Las migraciones y seeds están en `backend/migrations` y `backend/seeds`.

Planeada migración a PostgreSQL (ver `docs/MIGRATE_TO_POSTGRES.md`).

## Multimedia y almacenamiento

La gestión de archivos se prueba con `backend/uploads/` en desarrollo. Para producción se recomienda usar Firebase Storage o S3.

Funciones implementadas:

- Extracción EXIF y obtención de coordenadas.
- Generación de thumbnails y compresión.

## Frontend admin

El panel administrativo está en `frontend-admin/`. Usa React + Vite + Tailwind. Contiene componentes para listar y editar rutas, ver multimedia y moderar comentarios.

## Mobile

Esqueleto en `mobile/`. Revisa `mobile/README.md` para instrucciones específicas.

## Scripts y utilidades

Scripts disponibles en `scripts/`:

- `update_docs_index.ps1` — genera `docs/INDEX.md` (índice simple).
- `generate_checklist_status.ps1` — genera `docs/STATUS.md` a partir de `logs/checklist.md`.
- `ci_regen_and_push.ps1` — backup + regeneración + commit/push (uso local y opcional).

## Checklist maestro y estado

El checklist maestro se mantiene en `logs/checklist.md`. Es la fuente única para estado de tareas y planificación.

Estado generado: `docs/STATUS.md` (ver enlace en la raíz).

## Cómo contribuir

- Abrir issues para bugs y documentación.
- PRs: preferir pequeñas unidades de trabajo; documentar cambios en `docs/` cuando sean relevantes.

## Contacto y mantenimiento

Mantener el documento `docs/LAST_SYNC.md` actualizado cuando se ejecuten regeneraciones automáticas.

---

Archivos relacionados:

- `docs/ARCHITECTURE.md`
- `docs/ROADMAP.md`
- `docs/MIGRATE_TO_POSTGRES.md`
- `docs/STATUS.md`
