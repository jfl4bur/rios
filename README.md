Proyecto Rios — monorepo

Estructura inicial y scripts de Sprint 0.

![CI](https://github.com/your-username/your-repo/actions/workflows/ci.yml/badge.svg)

Ver `README-ROADMAP.md` para el plan de trabajo y prioridades.

Carpetas:
- backend
- web
- mobile
- scripts

Instrucciones rápidas:
1. Backend: cd backend && npm install && npm run dev
2. Scripts de setup: see backend/scripts/setup.ps1 and setup.sh
# Prompt Maestro — Rutas, Ríos y Senderismo

Mini-esqueleto multiplataforma creado para iniciar el proyecto "Prompt Maestro Ultra Completo".

Estructura creada:
- backend/ (Node.js + Express + SQLite)
- frontend-admin/ (React + Tailwind)
- mobile/ (Flutter starter)
- config/config.json (mapas, firebase placeholders)
- setup.ps1, setup.sh (scripts de inicialización)

Backend:
- Ejecuta `npm install` en `backend` y luego `npm run seed:demo` para cargar datos demo.
- Inicia con `npm run dev`.
Nota: el backend ahora usa el puerto por defecto `9000` configurado en `config/config.json`.

API del backend (básico)
-----------------------

El backend expone un endpoint principal para listar rutas:

- GET `/api/rios` — devuelve una lista paginada de rutas.
	- Parámetros: `page` (default 1), `limit` (default 20, max 100).
	- Respuesta: JSON con `{ items, total, page, limit }`. Cada item contiene el campo `geometry` con GeoJSON parseado.

Consulta la documentación completa en `backend/README.md`.

Siguientes pasos rápidos:
1. Abrir una terminal en `backend` y ejecutar `npm install`.
2. Revisar `config/config.json` y añadir credenciales de Firebase y keys de Maps.
3. Ejecutar `node index.js` en `backend` (o `npm run dev`).

Ver `frontend-admin/README.md` y `mobile/README.md` para instrucciones específicas de cada parte.

## Arquitectura del sistema

Resumen (ver `docs/ARCHITECTURE.md` para detalles completos):

- App móvil (Flutter): interfaz principal para usuarios (iOS/Android).
- Backend (Node.js + Express): API RESTful que expone `/api/rios`, `/api/comentarios`, `/api/multimedia`.
- Frontend admin (React + Vite): panel administrativo y vistas de gestión.
- Almacenamiento: SQLite para desarrollo; PostgreSQL planificado para producción.
- Archivos multimedia: Firebase Storage o S3 en producción; `backend/uploads/` en desarrollo.

Próximos pasos recomendados:

- Preparar migración a PostgreSQL.
- Documentar contratos de API (OpenAPI/Swagger).
- Definir pipeline de despliegue para staging y producción.
