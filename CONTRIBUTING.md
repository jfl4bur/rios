Contribuir al proyecto Rios
===========================

Gracias por querer contribuir. Este documento describe el flujo básico para colaborar en el repositorio.

1. Flujo de trabajo (branches)
- Usa ramas con prefijo `feat/`, `fix/`, `chore/` según corresponda, por ejemplo `feat/validation-rios`.
- Empuja tu rama al remoto y abre una Pull Request contra `main`.

2. Antes de abrir la PR
- Actualiza tu rama con `git pull --rebase origin main`.
- Ejecuta los checks locales:
  - Backend: desde `backend/` ejecutar `npm ci` y `npm test`.
  - Si cambias dependencias, ejecuta `npm audit`.
- Añade tests automatizados cuando agregues comportamiento nuevo.

3. PR
- Usa un título claro y una descripción con el resumen de cambios y la lista de archivos relevantes.
- Etiqueta la PR con `backend`, `frontend` u otras etiquetas según corresponda.
- Añade al menos un reviewer del equipo antes de mergear.

4. Revisión y merge
- Espera que CI esté verde y que haya al menos una revisión aprobatoria.
- Si la PR arregla vulnerabilidades o cambios en dependencias, documenta el motivo en el cuerpo de la PR.
- Mergea usando squash-merge (salvo indicación contraria) y deja un mensaje claro.

5. Seguridad
- Si encuentras un issue de seguridad, crear un issue privado o contacta directamente a `@jfl4bur`.

6. Estilo de commits
- Sigue convención breve: `feat:`, `fix:`, `chore:`, `docs:`.
- Incluye referencia a la PR/issue si aplica.

7. Comunicación
- Usa el issue tracker para discusión; si es urgente, menciona a `@jfl4bur`.

Gracias por tu contribución.
