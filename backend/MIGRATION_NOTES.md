# Notas de migración

- Se añadió la migración `002_add_lat_lng.sql` que ejecuta:

```sql
ALTER TABLE rios ADD COLUMN lat REAL;
ALTER TABLE rios ADD COLUMN lng REAL;
```

- El runner de migraciones (`scripts/run_migrations.js`) ahora saltará esta migración si detecta que la columna `lat` ya existe (previene error `duplicate column name`).

- Filas existentes pueden tener `lat`/`lng` NULL; ejecuta `node scripts/populate_lat_lng.js` para poblar desde `geometry`.

- Recomendación: ejecutar `npm run migrate` y verificar con `node scripts/check_schema_and_rows.js`. .
