Guía rápida para desarrolladores — Rios
=====================================

Objetivo

Documento breve con los comandos y convenciones para trabajar localmente con el backend y la base del proyecto.

Requisitos

- Node.js >= 18 (preferible v24) y npm
- Git
- (Opcional) Python si vas a usar herramientas como `git-filter-repo` para limpieza de historial

Arrancar el backend

Desde la raíz del repo:

```pwsh
# instalar deps del workspace
npm ci --workspaces
# arrancar backend (por defecto se expone en 9000)
npm --prefix backend start
```

Migraciones y datos

El backend incluye scripts de migración en `backend/migrations` y utilidades en `backend/scripts`.

```pwsh
# correr migraciones (muévete al backend si el script está allí)
npm --prefix backend run migrate
# seed demo data
npm --prefix backend run seed:demo
```

Tests

Se utilizan tests con `node --test` en `backend/tests`.

```pwsh
# ejecutar tests del backend
npm --prefix backend test
```

E2E (esqueleto)

Hay un TODO para tests end-to-end que arranquen frontend + backend. Como paso mínimo:

- Arrancar backend en localhost:9000
- Arrancar frontend (si procede)
- Ejecutar un script de integración que haga requests HTTP a endpoints críticos

Auditoría y seguridad

```pwsh
# ejecutar auditoría de dependencias
npm --prefix backend audit
# intentar arreglos automáticos (safe)
npm --prefix backend audit fix
```

Limpieza del repo (artefactos)

- `backend/uploads/` y `backend/logs/` deben estar en `.gitignore`.
- Si hay que eliminar artefactos ya versionados, usar `git-filter-repo` (requiere instalación via pip) o abrir un issue antes de reescribir historial.

Flujo para abrir PRs

1. Crea rama: `git checkout -b feat/mi-cambio`.
2. Realiza cambios y tests locales.
3. `git push origin feat/mi-cambio` y abre PR.
4. Etiqueta reviewers, corrige feedback, espera CI verde y mergea.

Consejos

- Mantén los tests verdes en tu entorno antes de abrir PR.
- Añade documentación mínima a `backend/MIGRATION_NOTES.md` si tocas la BD.

Dónde encontrar ayuda

- Issues del repo para bugs y tareas.
- Contacta a `@jfl4bur` para dudas de despliegue o seguridad.

Gracias — empezamos con estos puntos para mantener el proyecto ordenado.
