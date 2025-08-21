# Changelog

## v1.0.0 - 2025-08-18

Cambios principales incluidos en esta versión:

### Commit de la release

- Hash: ca2bb578879c193f84897492da97d8b3620a6656
- Mensaje:
`nfeat: validation for /api/rios (#1)  Merge feat/validation-rios: validation, migrations, tests, CI fixes

Archivos modificados en este commit:

.github/workflows/ci-backend.yml
.github/workflows/ci.yml
.gitignore
backend/MIGRATION_NOTES.md
backend/logs/dirlist.txt
backend/logs/register_preview.txt
backend/logs/smtp-elevated-output.txt
backend/logs/smtp-test-2025-08-17T10-32-02-738Z.json
backend/logs/smtp-test-2025-08-17T11-24-59-285Z.json
backend/logs/smtp-test-2025-08-17T11-27-12-065Z.json
backend/logs/smtp-test-2025-08-17T12-02-15-921Z.json
backend/logs/smtp-test-2025-08-17T17-16-37-622Z.json
backend/logs/smtp-test-2025-08-17T17-18-40-137Z.json
backend/logs/smtp-test-2025-08-17T17-20-53-899Z.json
backend/logs/smtp-test-2025-08-17T17-29-27-266Z.json
backend/logs/smtp-test-2025-08-17T21-46-01-277Z.json
backend/logs/smtp-test-2025-08-17T21-52-04-427Z.json
backend/logs/smtp-test-2025-08-17T21-59-24-227Z.json
backend/logs/smtp-test-2025-08-17T22-07-58-277Z.json
backend/logs/smtp-test-2025-08-17T22-12-05-585Z.json
backend/logs/smtp-test-2025-08-17T22-12-37-912Z.json
backend/logs/taskinfo.txt
backend/logs/thumb-duplicates-2025-08-17T10-41-42-239Z.json
backend/logs/thumb-duplicates-2025-08-17T10-41-54-425Z.json
backend/logs/thumb-duplicates-2025-08-17T10-43-31-205Z.json
backend/logs/webhook-2025-08-17T09-24-50-223Z.json
backend/logs/webhook-2025-08-17T09-30-33-226Z.json
backend/logs/webhook-2025-08-17T10-09-59-428Z.json
backend/logs/webhook-2025-08-17T10-33-31-077Z.json
backend/logs/webhook-2025-08-17T12-07-23-468Z.json
backend/package-lock.json
backend/tests/http_check.js
backend/tests/multimedia_test_request.js
backend/uploads/1755410166363-sample.png
backend/uploads/1755410313505-sample.png
backend/uploads/1755410521380-sample.png
backend/uploads/1755410618761-sample.png
backend/uploads/1755410682505-sample.png
backend/uploads/1755411401535-sample.png
backend/uploads/1755411669266-sample.png
backend/uploads/1755413200148-sample.png
backend/uploads/1755413273019-sample.png
backend/uploads/1755413684837-sample.png
backend/uploads/1755414843349-c07a6137-0a60-4901-ab36-844c5520971f.png
backend/uploads/1755414947055-6f6c512e-3f49-48a0-adbc-0fcaa42648b0.png
backend/uploads/1755414952616-5a853e37-413a-4eae-8a29-f0766e6b46d6.png
backend/uploads/1755467161576-a47062b4-7ef3-4f19-b7fc-163602e6e09f.png
backend/uploads/1755467526443-f3c39ffc-b3b2-4e03-bd64-959fadd11274.png
backend/uploads/1755467964509-89593b0d-bbbb-4ea8-90da-4e9e84207305.png
backend/uploads/1755468478538-49082c61-79cd-4e84-b789-21e84c47a388.png
backend/uploads/1755468725891-c60a3148-5b8a-4543-9a4c-cbc419dae9b7.png
backend/uploads/1755468758173-461d0f6f-868a-4cca-abf0-57737694f877.png
backend/uploads/thumb-1755410166363-sample.jpg
backend/uploads/thumb-1755410313505-sample.jpg
backend/uploads/thumb-1755410521380-sample.jpg
backend/uploads/thumb-1755410618761-sample.jpg
backend/uploads/thumb-1755410682505-sample.jpg
backend/uploads/thumb-1755411401535-sample.jpg
backend/uploads/thumb-1755411669266-sample.jpg
backend/uploads/thumb-1755413200148-sample.jpg
backend/uploads/thumb-1755413273019-sample.jpg
backend/uploads/thumb-1755413684837-sample.jpg
backend/uploads/thumb-1755414843349-c07a6137-0a60-4901-ab36-844c5520971f.jpg
backend/uploads/thumb-1755414947055-6f6c512e-3f49-48a0-adbc-0fcaa42648b0.jpg
backend/uploads/thumb-1755414952616-5a853e37-413a-4eae-8a29-f0766e6b46d6.jpg
backend/uploads/thumb-1755467161576-a47062b4-7ef3-4f19-b7fc-163602e6e09f.jpg
backend/uploads/thumb-1755467526443-f3c39ffc-b3b2-4e03-bd64-959fadd11274.jpg
backend/uploads/thumb-1755467964509-89593b0d-bbbb-4ea8-90da-4e9e84207305.jpg
backend/uploads/thumb-1755468478538-49082c61-79cd-4e84-b789-21e84c47a388.jpg
backend/uploads/thumb-1755468725891-c60a3148-5b8a-4543-9a4c-cbc419dae9b7.jpg
backend/uploads/thumb-1755468758173-461d0f6f-868a-4cca-abf0-57737694f877.jpg

Referencias:
- PR: https://github.com/jfl4bur/rios/pull/1
- Release: https://github.com/jfl4bur/rios/releases/tag/v1.0.0


## Unreleased / 2025-08-22

### Changes

- Merge: PR #16 — feat(rios): paginated GET /api/rios
	- Añade endpoint paginado `GET /api/rios` con parámetros `page` y `limit`.
	- Tests: `backend/tests/list_rios.test.js` añadido para verificar paginación.
	- Docs: `backend/README.md` actualizado con descripción del endpoint.

### CI / infra

- La integración CI fue ajustada para arrancar un servidor dummy y crear la DB sqlite en los jobs de test; runs recientes para la PR y merge pasaron correctamente.


