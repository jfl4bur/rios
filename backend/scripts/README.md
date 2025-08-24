run_migrations.ps1

Este directorio contiene scripts auxiliares para el backend. El script `run_migrations.ps1` permite:

- Crear una copia de seguridad timestamped del fichero SQLite (por ejemplo `backend/data.sqlite.20250824_224800.bak`).
- Aplicar ordenadamente los archivos `.sql` que se ubiquen en `backend/migrations/`.
- Soporta `-DryRun` para listar las migraciones sin aplicarlas.

Uso:

```pwsh
pwsh -NoProfile -File backend/scripts/run_migrations.ps1 -DbPath "backend/data.sqlite" -DryRun
```

Recomendación: ejecuta primero con `-DryRun` y revisa que las migraciones están en el orden correcto.
