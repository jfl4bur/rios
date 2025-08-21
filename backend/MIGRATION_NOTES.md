# Migraciones y copias de seguridad — Backend (SQLite)

## Resumen

Notas prácticas y paso a paso para aplicar migraciones SQL, realizar copias de seguridad y ejecutar rollback en bases SQLite usadas por el backend.

## Alcance

- Aplicar migraciones SQL que están en `backend/migrations/`.
- Ejecutar scripts de transformación/post-migra (`backend/scripts/*`).
- Crear backups antes de cambiar la BD y ofrecer formas seguras de rollback.

## Suposiciones

- Sustituye `<RUTA_DB>` por la ruta real a tu fichero SQLite (por ejemplo `backend/data.sqlite` o la usada en la configuración del entorno).
- Las migraciones se ordenan por nombre (ej.: `001_...`, `002_...`).
- Hay disponibilidad de la CLI `sqlite3` para dumps; si no está disponible, usa copia de fichero como backup.

## Checklist rápida antes de tocar la BD

- [ ] Crear y verificar backup (archivo y/o dump SQL).
- [ ] Ejecutar migraciones en una copia local y pasar tests.
- [ ] Revisar el contenido de las migraciones por parte de un reviewer.
- [ ] Plan de rollback y ventana de mantenimiento si la migración es disruptiva.

## 1) Copias de seguridad (backup)

### A. Copia del fichero (rápida)

```pwsh
# PowerShell: copia el archivo de la base de datos con timestamp
Migraciones y copias de seguridad — Backend (SQLite)

Resumen

Notas prácticas y paso a paso para aplicar migraciones SQL, realizar copias de seguridad y ejecutar rollback en bases SQLite usadas por el backend.

Alcance

- Aplicar migraciones SQL que están en `backend/migrations/`.
- Ejecutar scripts de transformación/post-migra (`backend/scripts/*`).
- Crear backups antes de cambiar la BD y ofrecer formas seguras de rollback.

Suposiciones

- Sustituye `<RUTA_DB>` por la ruta real a tu fichero SQLite (por ejemplo `backend/data.sqlite` o la usada en la configuración del entorno).
- Las migraciones se ordenan por nombre (ej.: `001_...`, `002_...`).
- Hay disponibilidad de la CLI `sqlite3` para dumps; si no está disponible, usa copia de fichero como backup.

Checklist rápida antes de tocar la BD

- [ ] Crear y verificar backup (archivo y/o dump SQL).
- [ ] Ejecutar migraciones en una copia local y pasar tests.
- [ ] Revisar el contenido de las migraciones por parte de un reviewer.
- [ ] Plan de rollback y ventana de mantenimiento si la migración es disruptiva.

1) Copias de seguridad (backup)

### A. Copia del fichero (rápida)

```pwsh
# PowerShell: copia el archivo de la base de datos con timestamp
$DB = "<RUTA_DB>"
$ts = Get-Date -Format "yyyyMMdd_HHmmss"
$backup = "${DB}.${ts}.bak"
Copy-Item -Path $DB -Destination $backup -Force
Write-Output "Backup creado: $backup"
```

### B. Dump SQL (útil para inspecciones o restauraciones parciales)

```pwsh
# Requiere sqlite3 en PATH
$DB = "<RUTA_DB>"
$ts = (Get-Date).ToString('yyyyMMdd_HHmmss')
$out = "backup-$ts.sql"
sqlite3 "$DB" ".output $out" ".dump" ".exit"
Write-Output "Dump SQL creado: $out"
```

Verificación rápida del backup:

```pwsh
Get-FileHash $backup -Algorithm SHA256
Get-Item $backup | Select-Object Length
```

Consejo: guarda backups fuera del servidor (S3, blob storage) si la base es crítica.

2) Aplicar migraciones

Opción A — Usando `sqlite3` (aplicable en servidor o local)

```pwsh
$DB = "<RUTA_DB>"
# Aplicar un archivo específico
sqlite3 $DB ".read backend/migrations/002_add_lat_lng.sql"

# Aplicar todos los SQLs en orden (PowerShell)
Get-ChildItem -Path backend/migrations -Filter "*.sql" | Sort-Object Name | ForEach-Object {
  Write-Output "Aplicando: $($_.FullName)"
  sqlite3 $DB ".read $($_.FullName)"
}
```

Opción B — Usar script existente (Node)

```pwsh
# Si el proyecto incluye un runner de migraciones:
npm --prefix backend run migrate
```

Notas importantes

- Evita re-aplicar la misma migración sobre una misma base; los runners deberían detectar columnas/objetos existentes.
- Para migraciones largas/estructurales, considera crear una tabla nueva y migrar por batches.

3) Poblado y tareas post-migra

- Ejecuta scripts de post-migración (ejemplo: `node backend/scripts/populate_lat_lng.js`) para rellenar columnas calculadas.

```pwsh
# ejemplo
node backend/scripts/populate_lat_lng.js --db "<RUTA_DB>"
```

- Reindexa y analiza si añadiste índices: `ANALYZE` y `VACUUM` si procede.

4) Verificación post-migración

- Ejecuta la suite de tests del backend:

```pwsh
npm --prefix backend test
```

- Smoke tests HTTP sobre endpoints críticos (ej.: `GET /health`, `GET /api/rios/:id`).
- Revisa logs del backend y errores en runtime.

5) Rollback / Reversión

Estrategia preferida: restauración desde backup.

```pwsh
# Restaurar desde copia rápida (sobrescribe la DB actual)
Copy-Item -Path "<RUTA_DB>.<TIMESTAMP>.bak" -Destination "<RUTA_DB>" -Force
```

Si dispones de migraciones "down" (reversibles):

- Ejecuta el script `down` en una copia de la BD y revisa el resultado.
- No confíes en downs automáticos para cambios destructivos sin validación manual.

6) Consideraciones para producción

- Coordina una ventana de mantenimiento para cambios no atómicos.
- Mantén backups fuera del host y con retención definida.
- Para alta concurrencia y escalabilidad, evalúa migrar a RDBMS cliente/servidor (Postgres/MySQL).
- Para operaciones que bloquean, migrar por pasos: crear columna nueva, backfill por batches, swap y eliminar la columna antigua en una ventana corta.

7) Reparaciones y optimizaciones

- Si la base quedó grande tras una migración que eliminó datos, corre `VACUUM` para recuperar espacio.

```pwsh
sqlite3 "<RUTA_DB>" "VACUUM;"
```

8) Scripts opcionales

Si quieres, puedo añadir `backend/scripts/run_migrations.ps1` que:

- crea backup
- aplica migraciones en orden
- ejecuta scripts de post-migra
- escribe un log con resultados

Dime si lo creo y lo adapto a la configuración actual del proyecto.

Notas finales

Este documento complementa la herramienta de migraciones del proyecto (si existe). Antes de tocar producción, siempre prueba en copia y asegúrate de que el equipo está al tanto.
