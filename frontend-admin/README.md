Frontend admin (Vite + React)

Quickstart:

From `frontend-admin` folder (PowerShell):

```powershell
npm install
npm run dev
```

Development notes:

- The dev `index.html` now includes lightweight instrumentation that logs a
	stack trace when `window.merchant` is assigned. This helps identify browser
	extensions or injected scripts that create the global and cause runtime
	errors. The instrumentation does not mask errors and is safe for local
	debugging; remove it before production if desired.
