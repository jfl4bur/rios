Fastlane skeleton for iOS builds (Flutter)

Files created:
- `Fastfile` - lanes: `build_ios` and `upload_testflight`
- `Appfile` - basic app identifier and apple id placeholders

Environment variables required to upload to TestFlight (recommended):
- APP_STORE_CONNECT_KEY_ID - Key ID of the App Store Connect API key
- APP_STORE_CONNECT_ISSUER_ID - Issuer ID of the App Store Connect API key
- APP_STORE_CONNECT_KEY - Content of the .p8 key file (paste as single-line env or set as secret)

How to use:
1. Build IPA locally (or via CI):
   fastlane build_ios
2. Upload to TestFlight (after setting env vars/secrets):
   fastlane upload_testflight

Notes:
- You may prefer using a CI provider (GitHub Actions, Codemagic, Bitrise) to run these lanes.
- Keep your App Store Connect key secure; store it as a secret in CI.
- Adjust `Appfile` values or set environment variables to override.
