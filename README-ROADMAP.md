Roadmap y pasos siguientes para el proyecto Rios

Resumen:
Este documento contiene el plan priorizado para completar el MVP del proyecto Rios (backend, web-admin, mobile) y pasos operativos para tests, CI, y despliegue.

1) Prioridad alta (MVP backend)
- Endpoints REST: /api/rios, /api/comentarios, /api/multimedia, /api/usuarios
- Autenticación middleware con Firebase (opcional en dev)
- SQLite + script de seed/demo
- Tests: node:test smoke + endpoints

2) Web admin
- Vite + React + Tailwind
- Login via Firebase (token) y vistas básicas para listar/editar/rutas

3) Mobile
- Flutter demo app en directorio /mobile con datos precargados

4) Ops
- setup.ps1 y setup.sh para instalar Node/Flutter y crear DB
- CI (.github/workflows/ci.yml) ejecuta tests

5) Extras posteriores
- Export GPX/KML (ya añadido endpoint básico)
- Integración con Firebase Storage y FCM
- Offload multimedia a CDN

Como siguiente paso puedo:
- Añadir migrations SQL y tests adicionales
- Implementar panel admin básico
- Mejorar scripts de setup

Elige la siguiente tarea concreta o dime "continúa" para que empiece con la implementación seleccionada.
