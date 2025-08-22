Dev-only instrumentation and shims

This file documents the temporary development-only shims and instrumentation added to `index.html` to protect local dev from injected scripts and to collect evidence when `window.merchant` is assigned.

Key points

- Purpose: avoid runtime crashes in dev when extensions or injected scripts access `translations` and to collect evidence when `window.merchant` is created by external code.
- Scope: only runs when `location.hostname` is `localhost`, `127.0.0.1`, empty (file:) or local 192.168.* addresses.
- Files changed: `frontend-admin/index.html` (dev-only defensive interception, early i18n shim, merchant instrumentation).
- How it reports: POSTs to `http://localhost:9000/api/dev/reports/merchant` when possible and logs to console.
- Removal: this is temporary. Remove the dev-only guards and instrumentation before deploying to production.

If you want this removed or modified, open an issue or PR referencing this file.
