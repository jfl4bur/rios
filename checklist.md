# 📍 Proyecto Multiplataforma de Rutas, Ríos y Senderismo - Checklist

Esta versión del checklist refleja el estado actual del repositorio en la fecha indicada. Marqué los ítems que ya están implementados o con scaffold presente.

## Plan de ejecución (Windows 11 + iPhone sin Mac físico) — CONSOLIDADO

Este plan sustituye a planes separados: mantenemos una sola fuente de verdad dentro de este `checklist.md` para evitar dispersión y tareas olvidadas. A continuación hay un plan práctico, mapeado con los apartados del checklist para que cada paso actualice directamente el estado global.

Checklist operativo (pasos mínimos y relación con el checklist):

- [ ] 01 (11.1) Preparar entorno Windows: instalar Node.js, npm, Git, Visual Studio Build Tools, Android SDK, Android Studio y Flutter.  (Relacionado: 3.1, 11.1)
- [ ] 02 (3.1) Instalar Flutter SDK y verificar con `flutter doctor`. Configurar AVD/Emulador Android para pruebas rápidas. (Relacionado: 3.1, 10.1 mobile testing)
- [ ] 03 (3.3) Levantar backend local: instalar deps, ejecutar migraciones y seed; verificar endpoints básicos. Añadir script de verificación rápido. (Relacionado: 3.3, 10.3, 4)
- [ ] 04 (3.4) Configurar Firebase para entorno de pruebas (Auth, Storage, FCM). Guardar credenciales en `config/` o en secrets del CI. (Relacionado: 3.4, 12.2)
- [ ] 05 (16.2) Preparar CI para builds iOS: elegir proveedor (GitHub Actions macos-latest, Codemagic o Bitrise). Documentar y almacenar secrets necesarios (App Store Connect API key preferida). (Relacionado: 16.2, 11.1)
- [ ] 06 (3.1 / 6) Ajustes iOS en Flutter: configurar bundle id, entitlements y export options necesarios para CI (signing). (Relacionado: 3.1, 6.2)
- [~] 07 (16.2 / 3.1) Crear workflow CI macOS para build iOS + subida a TestFlight (skeleton creado: `.github/workflows/ci-ios.yml` y `fastlane/` skeleton). Requiere configuración de signing/secrets para upload a TestFlight. (Relacionado: 16.2, 6.2)
- [ ] 08 (8 / 6) Probar build en TestFlight y validar flows críticos en iPhone reales (crear feedback checklist de QA). (Relacionado: 8, 15.1)
- [ ] 09 (15.1) Añadir tests móviles básicos (unitarios y de integración) y ejecutar en CI; cubrir flows de creación de rutas y subida multimedia. (Relacionado: 15.1, 6)
- [ ] 10 (3.2 / 10.1) Estabilizar Android y Web: revisar scripts de build, publicar APK/aab y desplegar frontend en staging. (Relacionado: 3.2, 10.1)

Reglas operativas y prioridades

- Solo un plan maestro: `checklist.md` es la fuente única para el Plan de ejecución. Cualquier documento adicional deberá referenciar y no duplicar pasos críticos.
- Los pasos marcados como P0/P1 en este bloque deben reflejarse inmediatamente en las secciones relacionadas del `checklist.md` (marcar casilla o añadir nota de progreso).
- Cuando se cree un workflow CI o un fastlane lane, añadir una entrada al apartado `11.1 Setup Windows` y `16.2 CI/CD` indicando el path del archivo y los secrets necesarios.

Tareas inmediatas que voy a ejecutar ahora (si confirmas):

- A) Insertar un skeleton de workflow GitHub Actions en `.github/workflows/ci-ios.yml` que compile un IPA en `macos-latest` y acepte los secrets mínimos (no subirá a TestFlight hasta que configures secrets). Esto actualizará `16.2 CI/CD`.
- B) Alternativa: crear `fastlane/Fastfile` con lanes `build_ios` y `upload_testflight` para usar en Codemagic/Bitrise. Esto actualizará `11.1` y `16.2`.

Enlace con el checklist general (resumen relacional):

- 1. 🎯 Visión del Proyecto: confirmar prioridad iOS en la planificación y registrar la decisión de CI sin Mac físico.
- 3. 🔧 Configuración de Tecnologías: marcar sub-items 3.1, 3.3 y 3.4 como dependencias directas del plan.
- 6. 📸 Sistema Multimedia y 8. 🌟 Modo Demo: garantizar que la pipeline preserve assets y seeds al compilar en CI.
- 11. 🚀 Scripts de Configuración: añadir comandos concretos y paths de workflows/fastlane creados.
- 16. 📋 Deployment y DevOps: documentar los secrets, roles y pasos de despliegue en CI.

---

**Nota:** He dejado el resto del `checklist.md` intacto; este bloque ahora es la única versión canónica del Plan de ejecución. Si confirmas que proceda, implemento el skeleton de CI (opción "Actions") o el `Fastfile` (opción "Fastlane") y actualizaré las secciones relacionadas en el `checklist.md` marcando las entradas que ya quedan implementadas.


- ## 1. 🎯 Visión del Proyecto
- [x] Definir arquitectura del sistema integral
- [ ] Establecer prioridades de desarrollo (iOS > Android > Web)
- [ ] Crear documentación técnica base
- [ ] Validar viabilidad técnica y recursos

## 2. 👥 Análisis de Público Objetivo
- [ ] Investigar necesidades de senderistas
- [ ] Analizar comportamiento de excursionistas
- [ ] Estudiar comunidades de pescadores
- [ ] Definir personas de turistas y organizadores
- [ ] Validar casos de uso con comunidades locales

## 3. 🔧 Configuración de Tecnologías

### 3.1 Entorno Móvil
- [x] Crear proyecto Flutter base (carpeta `mobile/` con `main.dart`)
- [x] Configurar estructura de carpetas (esqueleto presente)
- [ ] (02) [3.1] 🔥 Instalar Flutter SDK (por hacer en la máquina de desarrollo)
- [ ] (06) [3.1] 🔥 Configurar desarrollo iOS
- [ ] (10) [3.1/3.2] 🔥 Configurar desarrollo Android

### 3.2 Entorno Web
- [x] Configurar React + Vite (`frontend-admin`)
- [x] Instalar TailwindCSS (config presente)
- [x] Crear layout base del panel admin
- [ ] Configurar routing y vistas completas

### 3.3 Backend
- [x] Configurar Node.js + Express (`backend/`)
- [x] Instalar SQLite (db code y migrations)
- [x] Crear estructura de base de datos (migrations y seed)
- [x] Configurar middleware básico (Firebase auth middleware present)
- [~] Preparar migración a PostgreSQL (en progreso — PR #29 merged: added Postgres adapter, docker-compose and test runner)

 ## 3.4 Servicios Externos
 - [ ] (04) [3.4] 🔥 Configurar Firebase Authentication (credentials required)
 - [ ] (04) [3.4] 🔥 Configurar Firebase Cloud Messaging
 - [ ] (04) [3.4] 🔥 Configurar Firebase Storage
- [x] Integrar Google Maps / Mapbox (config placeholder en `config/config.json`)
- [x] Crear archivo `config/config.json`

## 4. 📱 Funcionalidades Core

 - [x] Ejecutar migraciones y seed (crear ruta de prueba) — completado 2025-08-23 (ruta de prueba creada)
 - [x] Eliminar archivos temporales y scripts de herramientas de testing (tools/post_route* y tmp_*.json) — completado
 - [x] Guardar GET /api/rios en `backend/tmp_rutas.json` — completado (1 item guardado)
 - Nota: ruta creada durante pruebas: id `d2481fb4-741a-4b43-8bb6-576c136fca97` (referencia en `backend/notes/created_route.json`)
### 4.2 Visualización
- [x] Vista en modo lista (frontend) — implementado y verificado (`frontend-admin/src/RutasList.jsx`, `frontend-admin/src/App.jsx`) (2025-08-23)
- [x] Vista en modo mapa (frontend) — implementado y verificado (`frontend-admin/src/RutasList.jsx`, `frontend-admin/src/App.jsx`) (2025-08-23)

## 5. 👥 Funcionalidades Sociales

### 5.1 Sistema de Comentarios
- [x] CRUD comentarios básico (`/api/comentarios`)
- [ ] Sistema de hilos/respuestas
- [ ] Validación y moderación
- [ ] Notificaciones de respuesta

### 5.2 Menciones y Etiquetas
- [ ] Parser de menciones @usuario
- [ ] Autocompletado de usuarios
- [ ] Notificaciones de mención

### 5.3 Interacciones
- [ ] Sistema de likes
- [ ] Sistema de favoritos

### 5.4 Compartir
- [ ] Generación de enlaces únicos
- [ ] Integración redes sociales

## 6. 📸 Sistema Multimedia



### 6.1 Subida de Archivos
- [ ] (08) [6.1] 🔥 Interfaz de selección múltiple (frontend)
- [ ] (08) [6.1] 🔥 Captura desde cámara
- [ ] (08) [6.1] 🔥 Selección desde galería
- [ ] (08) [6.1] 🔥 Validación de formatos

### 6.2 Procesamiento
- [x] Extracción de metadatos EXIF (libs + scripts present)
- [x] Obtención automática de coordenadas (EXIF + geometry)
- [x] Compresión automática (sharp usage present)
- [x] Generación de thumbnails (scripts present)
 - [ ] (08) [6.2] 🔥 Optimización para web (further tuning)

### 6.3 Galería
- [ ] Vista en grid responsiva
- [ ] Paginación infinita
- [ ] Carga progresiva (lazy loading)
- [ ] Zoom y navegación
- [ ] Slideshow/carrusel

## 7. 🎨 Personalización de Usuario

### 7.1 Temas Visuales
- [ ] Tema claro
- [ ] Tema oscuro
- [ ] Tema "Hiking Map Style"
- [ ] Tema minimalista
- [ ] Persistencia de preferencias

### 7.2 Configuración de Interface
- [ ] Selector vista por defecto (mapa/lista)
- [ ] Configuración de notificaciones
- [ ] Preferencias de privacidad

### 7.3 Internacionalización
- [ ] Sistema i18n base
- [ ] Traducciones español
- [ ] Traducciones inglés
- [ ] Detección automática de idioma
- [ ] Selector manual de idioma

## 8. 🌟 Modo Demo

### 8.1 Datos Precargados
- [x] Rutas icónicas (Caminito del Rey) — seed demo present
- [x] Torres del Paine — seed demo present
- [x] Machu Picchu — seed demo present
- [ ] Camino de Santiago
- [ ] Otras rutas famosas

### 8.2 Contenido Simulado
- [x] Usuarios demo (seed)
- [x] Comentarios realistas (seed)
- [x] Fotos de muestra (uploads/)
- [x] Interacciones simuladas

## 9. 🖥️ Panel Web Administrativo

### 9.1 Autenticación
- [ ] Login seguro (frontend)
- [ ] Gestión de sesiones
- [ ] Roles de administrador
- [ ] Dashboard principal

### 9.2 Gestión de Contenido
- [ ] Lista de usuarios (frontend)
- [ ] Buscador avanzado
- [ ] Editor de rutas
- [ ] Moderación de comentarios
- [ ] Gestión multimedia
	- [x] Modal de edición completo para rutas (nombre, descripcion, categoria, dificultad, duracion_estimada, geometry, multimedia, lat/lng) — implementado

### 9.3 Estadísticas
- [ ] Contador de usuarios activos
- [ ] Métricas de rutas
- [ ] Contenido pendiente
- [ ] Reportes de uso
- [ ] Gráficos y analytics

### 9.4 Moderación
- [ ] Sistema de reportes
- [ ] Herramientas de moderación
- [ ] Historial de acciones
- [ ] Notificaciones a usuarios

## 10. 🔧 Backend API

### 10.1 Endpoints RESTful
- [x] `/api/rios` - CRUD rutas (GET/POST basic + GPX export)
- [x] `/api/comentarios` - CRUD comentarios (basic)
- [x] `/api/multimedia` - gestión archivos (endpoints present)
- [x] `/api/usuarios` - perfil y config (routes present)
- [x] `/api/auth` - autenticación (skeleton route present)
- [ ] `/api/admin` - funciones admin

### 10.2 Seguridad y Validación
- [x] Middleware de autenticación Firebase (optional/required middleware present)
- [ ] Validación de datos entrada
- [ ] Rate limiting
- [ ] Sanitización de inputs
- [ ] Manejo de errores (improvements possible)

### 10.3 Base de Datos
- [x] Esquema SQLite desarrollo
- [x] Migraciones (migrations/ folder + runner)
- [x] Índices optimizados (basic indexes in migrations)
- [ ] Scripts de respaldo
- [ ] Preparar migración PostgreSQL

### 10.4 Testing
- [x] Tests unitarios con node:test (smoke tests present)
- [x] Tests de integración (basic http checks present)
- [x] Tests de endpoints API (basic tests exist)
- [ ] Mocks de servicios externos
- [ ] Coverage mínimo 80%

## 11. 🚀 Scripts de Configuración

 ### 11.1 Setup Windows (setup.ps1)
 - [x] Verificación Node.js (script checks)
 - [ ] Instalación Flutter SDK (manual)
 - [x] Instalación dependencias npm (script runs `npm install`)
 - [ ] Instalación dependencias pub (manual)
 - [x] Creación base SQLite (migrations runner present)
 - [x] Descarga config Firebase demo (prompts/scripts present)
 - [x] Prompts interactivos
 - [x] Lanzamiento automático (local_all_in_one, dev_start scripts present)
 - [x] [11.1] 🔥 Instalación Git y configuración básica (user.name + user.email)
 - [x] [11.1] 🔥 Instalación Visual Studio Build Tools (C++ toolchain) y configuración PATH
 - [x] [11.1] 🔥 Instalación Android SDK / Android Studio (SDK tools + Platform tools) y configuración ANDROID_HOME/ANDROID_SDK_ROOT
 - [x] [11.1] 🔥 Verificar PATH y variables (node, npm, git, adb)
 - [ ] (05) [16.2] 🔥 Configurar CI macOS para builds iOS (GitHub Actions / Codemagic / Bitrise)

### 11.2 Setup Unix (setup.sh)
- [x] Adaptación para bash
- [x] Verificación de permisos
- [x] Instalación de dependencias Linux/Mac (script runs npm install)
- [x] Scripts de desarrollo
- [x] Configuración de puertos

## 12. 🔐 Seguridad

### 12.1 Validación Backend
- [ ] Esquemas de validación (Joi/Zod)
- [ ] Sanitización SQL injection
- [ ] Validación tipos archivo
- [ ] Límites de tamaño
- [ ] Rate limiting por IP

### 12.2 Firebase Security
- [ ] Reglas Storage desarrollo
- [ ] Reglas Storage producción
- [ ] Configuración CORS
- [ ] Tokens de acceso seguros

## 13. ⚡ Optimización

### 13.1 Performance Frontend
- [ ] Lazy loading componentes
- [ ] Paginación inteligente
- [ ] Compresión imágenes
- [ ] Cache estratégico
- [ ] Bundle optimization

### 13.2 Performance Backend
- [ ] Índices base de datos (further tuning)
- [ ] Query optimization
- [ ] Compresión respuestas
- [ ] Cache Redis (opcional)
- [ ] CDN para multimedia

### 13.3 Performance Móvil
- [ ] Optimización Flutter
- [ ] Reducción bundle size
- [ ] Carga progresiva mapas
- [ ] Gestión memoria
- [ ] Battery optimization

## 14. 📈 Marketing y Escalabilidad

### 14.1 Exportación
- [x] Export GPX (endpoint implemented)
- [ ] Export KML
- [ ] Export PDF rutas
- [ ] Compartir archivos

### 14.2 SEO Web
- [ ] Meta tags optimizados
- [ ] Sitemap XML
- [ ] Schema markup
- [ ] URLs amigables
- [ ] Open Graph

### 14.3 Escalabilidad
- [ ] Documentar arquitectura microservicios
- [ ] Separación de responsabilidades
- [ ] APIs versionadas
- [ ] Monitoring básico
- [ ] Logs estructurados

## 15. 🧪 Testing y QA

### 15.1 Testing Móvil
- [ ] Tests unitarios Flutter
- [ ] Tests de widgets
- [ ] Tests de integración
- [ ] Tests en dispositivos reales

### 15.2 Testing Web
- [ ] Tests componentes React
- [ ] Tests E2E (Cypress/Playwright)
- [ ] Tests responsivos
- [ ] Tests cross-browser

### 15.3 QA Manual
- [ ] Casos de prueba
- [ ] Testing usabilidad
- [ ] Testing accesibilidad
- [ ] Performance testing

## 16. 📋 Deployment y DevOps

### 16.1 Entornos
- [ ] Desarrollo local
- [ ] Staging environment
- [ ] Producción
- [ ] Variables de entorno

### 16.2 CI/CD
- [x] GitHub Actions / GitLab CI (basic workflow present)
- [x] Tests automáticos (backend tests configured in CI)
- [ ] Build automático
- [ ] Deploy automático
  
**iOS CI workflow**: se añadió un skeleton de workflow para compilar IPA en `macos-latest`.
- Path: `.github/workflows/ci-ios.yml` (skeleton creado, requiere configuración de signing/secrets para upload a TestFlight)
- Estado: Iniciado (marcar 07 en el Plan de ejecución como en progreso)
 - Fastlane skeleton: `fastlane/Fastfile` y `fastlane/Appfile` creados (lanes: build_ios, upload_testflight)
 - Estado: Iniciado (07 en progreso)

### 16.3 Monitoreo
- [ ] Logs centralizados
- [ ] Alertas básicas
- [ ] Métricas de uso
- [ ] Health checks

---

## 📊 Progreso General

- **Total tareas**: 200+
- **Completadas**: _marcadas en el checklist_
- **En progreso**: _varias_
- **Pendientes**: _varias_

**Porcentaje completado**: _estimado por revisar_

---

## 📝 Notas de Desarrollo

Fecha inicio: 01/06/2024  # (asumido a efectos de historial)
Última actualización: 22/08/2025
Próxima milestone: Implementar y probar flujo "Crear nueva ruta" en local
Desarrollador principal: jfl4bur

**Estado actual del proyecto**: 
- [ ] 🔴 Planificación
- [x] 🟡 En desarrollo
- [ ] 🟢 MVP completo
- [ ] 🔵 Listo para producción

### Cambios recientes (marcados)
- [x] Añadido shim tolerante para i18n en `frontend-admin/index.html` (evita crash por `translations`).
- [x] Inicialización i18next en `frontend-admin/src/i18n.js` y import en `src/main.jsx`.
- [x] Dev instrumentation para detectar asignaciones a `window.merchant` y endpoint backend `POST /api/dev/reports/merchant` (archivo `backend/routes/dev_reports.js`).
- [x] Script de verificación `scripts/check_translation_shim.js` añadido (usa para comprobar presencia del shim en `index.html`).
- [x] Documento explicativo `frontend-admin/DEV_INSTRUMENTATION.md` agregado (guía para eliminar/activar instrumentos dev).
- [x] Regenerados lockfiles y merge de rama `fix/ci-lockfile` para resolver error de `npm ci` en CI (PR #31).
- [x] Tests backend ejecutados localmente: 12 tests — 12 passed (smoke tests).

### Cómo ejecutar rápido en local (Windows / PowerShell)

Ajusta los comandos si tu package.json usa otros nombres de scripts. Se ha añadido un runner para tests nativos y un script PowerShell para instalar dependencias y generar logs.

```powershell
# Desde la raíz del repo (PowerShell):
npm run test:all
# o ejecutar directamente:
pwsh -NoProfile -File .\scripts\run_backend_tests.ps1

# Alternativa: ejecutar solo en la carpeta backend
cd backend
npm install
npm test
```

Notas importantes:

- Si `npm ci` falla por problemas con módulos nativos en Windows (p.ej. EPERM unlink de DLLs), el script hace fallback a `npm install`.
- `sharp` fue movido a `optionalDependencies` y el backend ahora usa `backend/lib/imageProcessor.js` como wrapper para permitir operar sin `sharp`.

Endpoints locales a comprobar:

- Backend: [http://localhost:9000](http://localhost:9000) — raíz: {"ok":true,"message":"Rios backend listo"}
- Frontend Vite: [http://localhost:5173](http://localhost:5173)

Local status:

- [x] Backend local iniciado ([http://localhost:9000](http://localhost:9000))
- [x] Frontend Vite iniciado ([http://localhost:5173](http://localhost:5173))

### Siguientes pasos inmediatos (local-first)

- Ejecutar migraciones y seed (crear ruta de prueba). Puedo hacerlo si me autoriza a correr comandos locales.
- Abrir la app en el navegador y probar el flujo "Crear nueva ruta".

- [x] Ejecutar migraciones y seed (crear ruta de prueba) — completado 2025-08-23 (ruta de prueba creada)
- Abrir la app en el navegador y probar el flujo "Crear nueva ruta".

- Si reaparece el error relacionado con `translations`, revisar la pestaña Network para solicitudes a `/api/dev/reports/merchant` y compartir el contenido de `backend/dev_reports.jsonl`.

### Notas y asunciones
- Asumo que las convenciones de scripts son las habituales (`npm start`, `npm run dev`). Si no, indícame los nombres y los adapto.
- Las acciones de CI (merge) se limitaron a resolver lockfiles; no realicé cambios funcionales en producción.

---

*Actualizar este bloque cada vez que se haga un cambio significativo en la rama principal.*

---

*Actualizar este checklist regularmente para mantener visibilidad del progreso*

## Referencia rápida: ruta de prueba

- Extraída: 2025-08-23T13:33:31.589Z
- ID: `4ea4622b-4db6-4a3e-939b-076d28d80bf3`
- Nombre: `11111111`
- Descripción: `11111111111`
- Categoría: `general`
- Dificultad: `medio`
- Duración estimada: `20` minutos
- Coordenadas inicio: `lat: 40.89539632075453, lng: -5.843755440834799`
- Coordenadas fin: `end_lat: 40.89559566049234, end_lng: -5.843631688740547`

### Cómo borrar la ruta de prueba (dev)

Usa el header `x-dev-secret` con el valor por defecto `dev-secret` o ajusta la variable de entorno `DEV_CLEANUP_SECRET`.

```powershell
# Ejemplo: borrar la ruta de prueba por ID (PowerShell)
$id = '4ea4622b-4db6-4a3e-939b-076d28d80bf3'
$headers = @{ 'x-dev-secret' = 'dev-secret' }
Invoke-RestMethod -Uri "http://localhost:9000/api/rios/$id" -Method Delete -Headers $headers
```
