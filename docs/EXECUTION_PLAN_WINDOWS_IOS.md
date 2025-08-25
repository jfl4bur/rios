# Plan de ejecución: Windows 11 + iPhone (sin Mac físico)

Este documento recoge un plan ejecutable para desarrollar, probar y distribuir la app móvil cuando el entorno de desarrollo principal es Windows 11 y no hay un Mac físico disponible para firmar/compilar iOS localmente.

Resumen rápido
- Objetivo: permitir desarrollo en Windows (Android + Web), pruebas en iPhone reales usando builds firmados en CI que corren en macOS (GitHub Actions / Codemagic / Bitrise). 
- Requisitos mínimos locales: Windows 11 con PowerShell (pwsh), Node.js, Git, Flutter SDK, Android SDK/AVD.
- Requisitos CI: cuenta Apple Developer, App Store Connect API key o certificados/profiles, cuenta en servicio CI (GitHub Actions, Codemagic o Bitrise) y secrets configurados.

Checklist inicial (acciones concretas)
- [ ] Preparar Windows: instalar herramientas (Node, Git, Visual Studio Build Tools, Android SDK, Flutter)
- [ ] Levantar backend local y seeds de prueba
- [ ] Configurar Firebase (Auth, Storage, FCM) para entorno de pruebas
- [ ] Preparar repo para CI iOS (fastlane o App Store Connect API key)
- [ ] Crear workflow CI macOS para compilación iOS y subida a TestFlight
- [ ] Verificar en TestFlight y probar en iPhone reales

1) Preparar entorno Windows (pasos rápidos)

- Usar winget o Chocolatey (ejemplo con winget):

```powershell
# Actualizar/instalar herramientas
winget install --id Git.Git -e --source winget
winget install --id OpenJS.NodeJS -e --source winget
winget install --id Microsoft.VisualStudio.2022.BuildTools -e --source winget
# Android Studio/SDK: descargar desde web o usar winget si está disponible
```

- Instalar Flutter (sigue https://docs.flutter.dev):
  - Descargar el SDK, descomprimir en `C:\src\flutter` y añadir a PATH.
  - Ejecutar `flutter doctor` y solucionar avisos (aceptar licencias Android).

```powershell
# ejemplo mínimo
choco install flutter -y   # si usas Chocolatey
flutter doctor
```

- Configurar emulador Android para pruebas locales: Android Studio → AVD Manager.

2) Levantar backend local
- Desde la raíz del repo:

```powershell
# instalar dependencias y ejecutar migraciones/seeds (según repo)
pwsh -NoProfile -File .\scripts\run_backend_tests.ps1   # instala deps y ejecuta tests
cd backend
npm install
npm test
# migraciones / seeds: (ajustar según scripts del repo)
node ./scripts/run_migrations.js --seed
```

3) Configurar Firebase (entorno de pruebas)
- Crear proyecto Firebase (console.firebase.google.com)
- Añadir app iOS + app Android en el proyecto (registrar bundle id)
- Descargar `GoogleService-Info.plist` (iOS) y `google-services.json` (Android)
- Guardar archivos en `config/` o en repo privado; para CI, subirlos como secrets (o usar almacenamiento seguro en el servicio CI)

4) Estrategia para iPhone sin Mac físico

Opciones viables:
- A) GitHub Actions (macos-latest) — gratuito hasta límites, buena integración con repo.
- B) Codemagic — orientado a Flutter, manejo sencillo de signing y TestFlight.
- C) Bitrise — similar a Codemagic, con pasos predefinidos de Flutter.

Recomendación: usar Codemagic o Bitrise si prefieres interfaz/menús; usar GitHub Actions si quieres todo en el repo y control total.

Requisitos Apple para CI:
- Cuenta Apple Developer activa (99 USD/yr)
- App ID y Bundle ID registrados
- Opción preferida: crear una App Store Connect API Key (clave JWT) y usarla desde CI para subir builds a TestFlight (más segura que manejar certificados manuales)
- Alternativa: usar certificación/provisioning profiles exportados (fastlane match o export manual) — requiere almacenar certificados en secrets.

5) Ejemplo de flujo CI (alto nivel)
- Checkout repo
- Setup Flutter (install + cache)
- Restore pub & npm deps
- Build backend assets (si aplica)
- Build iOS: `flutter build ipa --release --export-options-plist=ios/ExportOptions.plist` o usar Fastlane lane
- Upload to TestFlight: usar `altool`/`xcrun` o Fastlane `deliver`/`pilot` o App Store Connect API

Secrets necesarios en CI
- APP_STORE_CONNECT_KEY (archivo p8) + key id + issuer id (si usas App Store Connect API)
- MATCH_PASSWORD / CERT_PASSWORD (si usas fastlane match)
- FIREBASE config files (si no se incluyen en repo)
- ENVs: BUNDLE_ID, APP_VERSION, etc.

6) Minimal GitHub Actions skeleton (te lo puedo crear)
- Job `build-ios` que corre en `macos-latest` con pasos:
  - actions/checkout
  - subosito/setup-flutter action
  - flutter pub get
  - flutter build ipa or fastlane
  - upload to TestFlight

7) Ajustes en Flutter / iOS project antes de CI
- En `ios/Runner.xcodeproj` y `ios/Runner.xcworkspace`:
  - Configurar `Bundle identifier` (coincide con App ID)
  - Configurar `Signing & Capabilities` si se usa manualmente (en CI se puede usar export options)
- Añadir `fastlane/Fastfile` con lanes `beta` (upload to TestFlight) y `build_ios`

8) Verificación y pruebas en iPhone
- Una vez subido a TestFlight, invitar testers y verificar distribución en dispositivos reales.
- Añadir pasos de QA: abrir TestFlight, instalar build, probar flujos críticos.

9) Backlog de tareas (prioridad inmediata)
- [P0] Crear archivo de plan (esto mismo) — HECHO (archivo en `docs/`)
- [P1] Preparar script de CI macOS (skeleton) + documentar secrets requeridos
- [P2] Documentar pasos para generar App Store Connect API Key y cómo subirla al CI
- [P3] Hacer build de prueba en Codemagic (opcional, más simple) y validar TestFlight

10) Next steps que realizo ahora (si confirmas)
- Crear un workflow skeleton en `.github/workflows/ci-ios.yml` que compile el IPA usando `macos-latest` y suba a TestFlight (requiere secrets). 
- Alternativamente, generar un `fastlane/Fastfile` con lanes `build_ios` y `upload_testflight`.

---

Notas finales
- Dado que no hay Mac físico, la parte crítica es organizar el signing en CI (App Store Connect API Key recomendado). Codemagic/Bitrise simplifican mucho este paso para Flutter. 
- Si quieres que implemente el workflow GitHub Actions o el Fastlane lane ahora, dime cuál prefieres (GitHub Actions o Codemagic lane) y lo creo en el repo.
