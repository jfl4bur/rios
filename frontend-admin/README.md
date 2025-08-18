Frontend admin (Vite + React)

Quickstart:

From `frontend-admin` folder (PowerShell):

```powershell
npm install
npm run dev
```

- The app reads `VITE_API_BASE` from `.env` (defaults to http://localhost:9000). Adjust if backend runs on another host/port.
- The app makes a request to `/api/rios` and lists entries.
