# Backend — instrucciones rápidas

Este README explica cómo levantar el entorno de desarrollo mínimo y ejecutar los tests locales para el backend.

Requisitos
- Node.js (>= 18, se ha probado en 24)
- npm

Scripts útiles (desde la raíz del repo o usando `--prefix backend`):

- Instalar dependencias (determinista):
  npm --prefix backend ci

- Crear DB de prueba (crea `backend/data.sqlite` con tablas mínimas usadas en tests):
  npm --prefix backend run create-test-db

- Arrancar servidor dummy para pruebas de subida multimedia (escucha en 127.0.0.1:9000 por defecto):
  npm --prefix backend run start-dummy-server

- Ejecutar la suite de tests (usa `node --test`):
  npm --prefix backend test

- Flujo rápido para pruebas locales (crea DB y corre tests):
  npm --prefix backend run test:local

Archivos relevantes
- `backend/scripts/create_test_db.js` — crea `backend/data.sqlite` con tablas mínimas para tests.
- `backend/scripts/start_dummy_server.js` — servidor HTTP simple que responde a POST `/api/multimedia/upload` con JSON.
- `backend/tests/*` — tests unitarios/integración de Node (ejecutables con `node --test`).
- `backend/logs/` — carpeta para salidas de prueba y logs de CI local.

Consejos
- Si necesitas detener el dummy server en Windows PowerShell (si lo arrancaste en background):
  Stop-Process -Id (Get-NetTCPConnection -LocalPort 9000).OwningProcess -Force

- Para depurar tests individuales usa:
  node --test ./backend/tests/post_rios.test.js --test-reporter=spec

Contacto
- Si algo falla, guarda `backend/logs/*.log` y pégalo en el issue/PR correspondiente para diagnóstico.

Última ejecución de tests local

- Fecha: 22-08-2025 (ejecución local registrada)
- Resultado: 8 tests, 0 fallos (ver `backend/logs/run_after_patch.log` para la salida completa)

Soporte de waypoints

- El backend acepta ahora `waypoints: [{lat,lng}, ...]` y los convierte internamente a GeoJSON `LineString`.
- Tests que verifican esto: `backend/tests/post_rios.test.js` (test 'LineString via waypoints').

API — endpoint paginado GET /api/rios
------------------------------------

GET /api/rios

- Parámetros query:
  - `page` (opcional): número de página (entero, default 1).
  - `limit` (opcional): items por página (entero, default 20, máximo 100).

- Respuesta (200):

```json
{
  "items": [ /* array de objetos rio; cada item incluye campo geometry parseado (objeto GeoJSON) */ ],
  "total": 123,    /* total de registros en la colección */
  "page": 1,
  "limit": 20
}
```

- Errores comunes:
  - `400` si `page` o `limit` no son numéricos.

Ejemplo:

GET /api/rios?page=2&limit=10

Devolverá hasta 10 rutas (items) y el total de rutas disponibles.


