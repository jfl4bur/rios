# Start backend and frontend-admin with logs
Set-Location -Path "$PSScriptRoot\backend"
Write-Output 'Starting backend...'
$node=(Get-Command node).Source
Start-Process -FilePath $node -ArgumentList 'index.js' -WorkingDirectory (Get-Location) -RedirectStandardOutput (Join-Path (Get-Location) 'server.log') -RedirectStandardError (Join-Path (Get-Location) 'server.err') -NoNewWindow
Start-Sleep -Seconds 2
Write-Output 'Backend started. Logs: backend\server.log, backend\server.err'

Set-Location -Path "$PSScriptRoot\frontend-admin"
Write-Output 'Starting frontend-admin (vite) in background...'
if (Test-Path node_modules\.bin\vite) {
  Start-Process -FilePath (Join-Path (Get-Location) 'node_modules\.bin\vite') -WorkingDirectory (Get-Location) -ArgumentList 'preview' -NoNewWindow
  Write-Output 'frontend-admin started with vite preview (background)'
} else {
  Write-Output 'frontend-admin: node_modules/.bin/vite not found; run npm install in frontend-admin first.'
}

Write-Output 'Done. Open http://localhost:9000 and the Vite URL shown by vite.'
