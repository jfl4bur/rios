# 📍 Proyecto Multiplataforma de Rutas, Ríos y Senderismo - Checklist

Esta versión del checklist refleja el estado actual del repositorio en la fecha indicada. Marqué los ítems que ya están implementados o con scaffold presente.

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
- [ ] Instalar Flutter SDK (por hacer en la máquina de desarrollo)
- [ ] Configurar desarrollo iOS
- [ ] Configurar desarrollo Android

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

### 3.4 Servicios Externos
- [ ] Configurar Firebase Authentication (credentials required)
- [ ] Configurar Firebase Cloud Messaging
- [ ] Configurar Firebase Storage
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
- [ ] Interfaz de selección múltiple (frontend)
- [ ] Captura desde cámara
- [ ] Selección desde galería
- [ ] Validación de formatos

### 6.2 Procesamiento
- [x] Extracción de metadatos EXIF (libs + scripts present)
- [x] Obtención automática de coordenadas (EXIF + geometry)
- [x] Compresión automática (sharp usage present)
- [x] Generación de thumbnails (scripts present)
- [ ] Optimización para web (further tuning)

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
