# Arquitectura del sistema — Ríos (resumen)

Fecha: 2025-08-22

Visión general
- App móvil (Flutter): interfaz principal para usuarios (iOS/Android).
- Backend (Node.js + Express): API RESTful que expone `/api/rios`, `/api/comentarios`, `/api/multimedia`, autenticación y administración.
- Frontend admin (React + Vite): panel administrativo y vistas de gestión.
- Almacenamiento: SQLite para desarrollo; PostgreSQL objetivo para producción.
- Almacenamiento de archivos: Firebase Storage (o S3) para multimedia en producción; carpeta `backend/uploads/` en desarrollo.

Componentes y responsabilidades
- Mobile (mobile/): UI, geolocalización, sincronización con backend, subida de multimedia y GPX export.
- Backend (backend/): lógica de negocio, validación, persistencia, generación GPX, manejo de multimedia, endpoints de administración.
- Frontend-admin (frontend-admin/): gestión de contenido, moderación y estadísticas.
- CI/CD: GitHub Actions para test, lint y despliegue; jobs definidos en `.github/workflows/`.

Flujo de datos (alto nivel)
1. Usuario crea una ruta desde la app móvil y sube multimedia.
2. La app envía POST a `/api/rios` con geometry/waypoints y archivos multimedia.
3. Backend valida, guarda en DB (SQLite/PG) y almacena archivos en Storage.
4. Frontend-admin consume API para moderar/editar rutas.

Decisiones técnicas claves
- Empezar con SQLite para simplificar setup local y CI; planificar migración a PostgreSQL con migraciones existentes.
- Separar carga de archivos en un servicio (Firebase/S3) para escalabilidad.
- Mantener la API REST con endpoints versionados `/api/v1/...` en próximas iteraciones.

Próximos pasos recomendados
- Definir esquema de despliegue (staging/production) y variables de entorno.
- Preparar migración a PostgreSQL y scripts de backup.
- Documentar contratos de API (OpenAPI/Swagger).

Contacto
- Mantener este documento actualizado en cada milestone.
