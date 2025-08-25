# Configurar secrets para iOS CI (App Store Connect + Firebase)

Este documento explica cómo obtener la App Store Connect API Key (.p8) y cómo añadir los secrets necesarios en GitHub para que el workflow iOS pueda subir automáticamente a TestFlight.

1) Crear App Store Connect API Key (desde App Store Connect)
- Accede a App Store Connect: https://appstoreconnect.apple.com/
- Ir a Users and Access → Keys: https://appstoreconnect.apple.com/access/api
- Click "Create API Key". Asigna un nombre y selecciona el rol "Developer" o el que tu organización prefiera.
- Descarga el fichero `AuthKey_<KEY_ID>.p8`. Guarda el `Key ID` y el `Issuer ID` (los necesitarás).

- APP_STORE_CONNECT_KEY_ID  -> Key ID (ej. ABC123XYZ)
- APP_STORE_CONNECT_ISSUER_ID  -> Issuer ID (UUID)
- APP_STORE_CONNECT_KEY  -> Contenido del fichero .p8 (todo el texto, en una sola variable)
2) Secrets requeridos en GitHub (repositorio)
- APP_STORE_CONNECT_KEY_ID  -> Key ID (ej. ABC123XYZ)
- APP_STORE_CONNECT_ISSUER_ID  -> Issuer ID (UUID)
- APP_STORE_CONNECT_KEY  -> Contenido del fichero .p8 (todo el texto, en una sola variable)
- APP_STORE_CONNECT_KEY_ID  -> Key ID (ej. ABC123XYZ)
- APP_STORE_CONNECT_ISSUER_ID  -> Issuer ID (UUID)
- APP_STORE_CONNECT_KEY  -> Contenido del fichero .p8 (todo el texto, en una sola variable)

Extras recomendados (si usas Firebase):
- FIREBASE_SERVICE_ACCOUNT_JSON -> JSON del service account (contenido entero)
- GOOGLE_SERVICES_JSON -> contenido del `google-services.json` (Android)
- GOOGLE_SERVICE_INFO_PLIST -> contenido del `GoogleService-Info.plist` (iOS) (opcional; también puedes guardar en el storage del CI)
- Accede a Firebase Console: https://console.firebase.google.com/

3) Cómo añadir secrets en la interfaz web
- Ve a GitHub Secrets (repository): https://github.com/jfl4bur/rios/settings/secrets/actions
- Documentación de GitHub Actions secrets: https://docs.github.com/en/actions/security-guides/encrypted-secrets
- Click "New repository secret"
- Rellena el nombre (por ejemplo `APP_STORE_CONNECT_KEY_ID`) y pega el valor.

4) Cómo añadir secrets con la CLI (`gh`) - PowerShell (Windows)
- Recomendado: usar `gh` autenticado con tu cuenta y permisos sobre el repo.
- gh CLI docs: https://cli.github.com/manual/

Ejemplo PowerShell (subir Key ID e Issuer):

```powershell
# Key/Issuer (pequeños valores)
gh secret set APP_STORE_CONNECT_KEY_ID --body "ABC123XYZ"
gh secret set APP_STORE_CONNECT_ISSUER_ID --body "00000000-0000-0000-0000-000000000000"
```

Ejemplo PowerShell (subir contenido del .p8):

```powershell
$p8 = Get-Content -Raw .\AuthKey_ABC123.p8
gh secret set APP_STORE_CONNECT_KEY --body $p8
```

Ejemplo PowerShell (subir JSON de Firebase):

```powershell
$json = Get-Content -Raw .\service-account.json
gh secret set FIREBASE_SERVICE_ACCOUNT_JSON --body $json
```

5) Validar en GitHub Actions
- Una vez añadidos los secrets, puedes disparar el workflow desde GitHub → Actions → seleccionar `CI - iOS Build (skeleton)` → `Run workflow` (el workflow está configurado para `workflow_dispatch`).
- Interfaz Actions del repo: https://github.com/jfl4bur/rios/actions
- Docs Fastlane (para upload): https://docs.fastlane.tools/
- Revisa los artefactos en la ejecución (ipa) y logs.

6) Seguridad
- No compartas el `.p8` ni el service account públicamente.
- Usa roles y permisos mínimos.

Si quieres, puedo generar un script PowerShell auxiliar que lea los ficheros locales y ejecute `gh secret set` por ti (no subo nada a GitHub sin que me proporciones los ficheros en este equipo). Si confirmas, lo creo en `scripts/set_github_secrets.ps1`.
