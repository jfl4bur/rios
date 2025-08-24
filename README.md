<!-- README generado para navegación fiable: anclas explícitas usadas para evitar problemas de slug -->

# 🚀 Proyecto Ríos — Monorepo

> Documentación central y navegable del proyecto.

[![status](https://img.shields.io/badge/status-active-brightgreen.svg)](#)

---

<details>
<summary><strong>📚 Tabla de contenidos (clic para expandir)</strong></summary>

- [🚀 Proyecto Ríos — Monorepo](#-proyecto-ríos--monorepo)
	- [📝 Visión general](#-visión-general)
	- [📅 Roadmap](#-roadmap)
	- [🎯 Estado y objetivos](#-estado-y-objetivos)
	- [📁 Estructura del repositorio](#-estructura-del-repositorio)
	- [⚙️ Instalación y arranque rápido](#️-instalación-y-arranque-rápido)
	- [🏗️ Arquitectura técnica](#️-arquitectura-técnica)
	- [🧩 Backend](#-backend)
	- [🖥️ Frontend admin](#️-frontend-admin)
	- [📱 Mobile](#-mobile)
	- [🗄️ Bases de datos y migraciones](#️-bases-de-datos-y-migraciones)
	- [🖼️ Multimedia y almacenamiento](#️-multimedia-y-almacenamiento)
	- [🛠️ Scripts y utilidades](#️-scripts-y-utilidades)
	- [📋 Checklist maestro y estado](#-checklist-maestro-y-estado)
- [Estado del checklist maestro](#estado-del-checklist-maestro)
	- [🤝 Cómo contribuir](#-cómo-contribuir)
	- [🔧 Comandos útiles](#-comandos-útiles)
	- [📞 Contacto y licencia](#-contacto-y-licencia)

</details>

---

<a id="vision-general"></a>
## 📝 Visión general

Proyecto multiplataforma para gestión y publicación de rutas (geometría + multimedia). Incluye backend, panel admin y cliente móvil.

---

<a id="roadmap"></a>
## 📅 Roadmap

Última actualización: 2025-08-24

- MVP (Q3 2025): completar CRUD rutas, subida multimedia, editor de rutas en `frontend-admin`.
- Backlog: migración a PostgreSQL, i18n, E2E tests.

(El checklist maestro en la raíz determina prioridades concretas).

---

<a id="estado-y-objetivos"></a>
## 🎯 Estado y objetivos

- Estado: desarrollo activo.
- Objetivo inmediato: estabilidad backend y funcionalidades básicas del admin.

---

<a id="estructura-del-repositorio"></a>
## 📁 Estructura del repositorio

- `backend/` — Node.js + Express (API, migraciones, seeds)
- `frontend-admin/` — React + Vite (panel admin)
- `mobile/` — cliente móvil (esqueleto)
- `logs/` — logs y `checklist.md`
- `scripts/` — utilidades de mantenimiento

---

<a id="instalacion-y-arranque-rapido"></a>
## ⚙️ Instalación y arranque rápido

Requisitos: Node.js 18+, npm, pwsh (PowerShell) en Windows.

Backend (dev):

```bash
cd backend
npm install
npm run dev
```

Frontend (dev):

```bash
cd frontend-admin
npm install
npm run dev
```

Variables de entorno mínimas (ejemplo `.env`):

```env
PORT=9000
DATABASE_URL=sqlite:./data.sqlite
UPLOAD_DIR=./backend/uploads
JWT_SECRET=your_secret
```

---

<a id="arquitectura-tecnica"></a>
## 🏗️ Arquitectura técnica

- Backend: Node.js + Express, REST API.
- Frontend admin: React + Vite + Tailwind.
- Mobile: cliente ligero (Flutter / React Native según histórico).
- Storage: SQLite en dev; PostgreSQL y S3/Firebase en producción.

---

<a id="backend"></a>
## 🧩 Backend

Endpoints principales:

- GET `/api/rios`
- POST `/api/rios` (creación de ruta + uploads)
- CRUD `/api/comentarios`

Ejemplo de uso:

```bash
curl -s "http://localhost:9000/api/rios?page=1&limit=10" | jq .
```

Estructura de datos mínima (ruta): id, title, description, geometry (GeoJSON), photos[], created_at.

---

<a id="frontend-admin"></a>
## 🖥️ Frontend admin

Arranque:

```bash
cd frontend-admin
npm install
npm run dev
```

Comprueba `vite.config.js` para proxy/CORS si el backend corre en distinto puerto.

---

<a id="mobile"></a>
## 📱 Mobile

Carpeta `mobile/` con el esqueleto del cliente. Revisa `mobile/README.md` (si existe) para instrucciones.

---

<a id="bases-de-datos-y-migraciones"></a>
## 🗄️ Bases de datos y migraciones

- Dev: SQLite. Prod: PostgreSQL (planificado).

Migraciones (ejemplo genérico):

```bash
cd backend
npm run migrate
npm run seed
```

---

<a id="multimedia-y-almacenamiento"></a>
## 🖼️ Multimedia y almacenamiento

- Dev: `backend/uploads/`.
- Procesado: EXIF, thumbnails, compresión.
- Recomendado: S3/Firebase + CDN en producción.

---

<a id="scripts-y-utilidades"></a>
## 🛠️ Scripts y utilidades

- `scripts/update_docs_index.ps1` — genera índice (puedes eliminar si vas a borrar `docs/`).
- `scripts/generate_checklist_status.ps1` — genera `docs/STATUS.md` (puedes eliminar si no lo necesitas).
- `scripts/ci_regen_and_push.ps1` — orquesta backup y regeneración (revisar antes de ejecutar).

---

<a id="checklist-maestro-y-estado"></a>
## 📋 Checklist maestro y estado

Accede al checklist maestro en la raíz: [checklist.md](./checklist.md)

# Estado del checklist maestro

Fecha: 2025-08-24 16:24:58

- Total ítems: 204
- Completados: 62
- Pendientes: 142

---

<a id="como-contribuir"></a>
## 🤝 Cómo contribuir

- Abrir issues para bugs/mejoras.
- PRs pequeñas, con tests y documentación cuando apliquen.

---

<a id="comandos-utiles"></a>
## 🔧 Comandos útiles

- Backend dev: `cd backend && npm install && npm run dev`
- Frontend dev: `cd frontend-admin && npm install && npm run dev`
- Regenerar docs (opcional): `pwsh -NoProfile -ExecutionPolicy Bypass -File .\scripts\ci_regen_and_push.ps1`

---

<a id="contacto-y-licencia"></a>
## 📞 Contacto y licencia

Mantén actualizado este README si haces cambios importantes. Añade `LICENSE` si procede.

---

(He colocado anclas explícitas y enlaces del TOC a esas anclas. Abre la previsualización de VS Code o usa `npx http-server . -p 8090` y luego visita `http://localhost:8090/README.md#roadmap` para comprobar.)
