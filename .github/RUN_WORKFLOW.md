Este repositorio incluye el workflow `.github/workflows/create_pr_from_chore.yml` que crea (si no existe) una Pull Request desde `chore/migrations-docs` hacia `main`.

Cómo usar:

1. Ir a la pestaña "Actions" en GitHub para este repositorio.
2. Seleccionar el workflow "Create PR from chore/migrations-docs".
3. Hacer clic en "Run workflow" y confirmar.

Notas:
- El workflow usa el token de GITHUB Actions con permisos `contents: write` y `pull-requests: write` para crear la PR.
- Si ya existe una PR de `chore/migrations-docs` hacia `main`, el workflow detectará eso y no creará una nueva.
