Backend tests and checks

- run_all_checks.ps1: powerhsell script that runs basic smoke checks and env loader test
- npm scripts added: `test:env`, `test:smtp`, `check` (runs the PowerShell runner)

Usage:

From backend folder:

pwsh -NoProfile -File scripts\run_all_checks.ps1

Or via npm:

npm run check

Notes:
- Tests are basic smoke tests and do not contain network mocking. Avoid running `test:smtp` unless you have valid SMTP creds in `backend/cleanup-notify.env`.
- The runner intentionally does not modify any credentials or scheduled tasks.
