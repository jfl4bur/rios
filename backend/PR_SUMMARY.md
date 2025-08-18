Resumen del PR: Validación y límites para POST /api/rios

Qué incluye:
- Agrega validación de entrada usando Joi en `backend/validation/riosSchema.js`.
- Valida `geometry` (Point/LineString), `waypoints`, `multimedia`, y campos básicos.
- Añade límites configurables: `MAX_WAYPOINTS` (env), `MAX_MEDIA` (env, default 20).
- Añade tests: `validation.test.js`, `multimedia_limits.test.js`.
- Crea scripts auxiliares y actualiza migraciones para soportar `lat/lng`.

Notas de migración:
- Nueva migración `backend/migrations/002_add_lat_lng.sql` agrega `lat` y `lng` a la tabla `rios`.
- `backend/scripts/run_migrations.js` ahora detecta si la columna `lat` ya existe y omite la migración para evitar errores.

Pasos para revisar y aplicar localmente:
1. Crear rama: `git checkout -b feat/validation-rios`
2. Comprobar cambios: `git status && git add -A && git commit -m "feat: add Joi validation for /api/rios and tests"`
3. Subir rama: `git push origin feat/validation-rios`
4. Crear PR desde la rama en GitHub describiendo `PR_SUMMARY.md`.

Recomendaciones:
- Ejecutar `npm install` en `backend` antes de correr tests.
- Revisar `MAX_MEDIA`/`MAX_WAYPOINTS` y ajustar env vars en despliegue.
