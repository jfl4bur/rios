Set-Location 'C:\Users\jflabur\Desktop\rios\backend\scripts'
.\run_cleanup_test.ps1 -SkipConfirm
Write-Output '--- tail cleanup.log ---'
Get-Content '..\logs\cleanup.log' -Tail 200 -Raw
Write-Output '--- latest webhook log ---'
$w = Get-ChildItem -Path '..\logs' -Filter 'webhook-*.json' -File -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if ($w) { Get-Content $w.FullName -Raw } else { Write-Output 'No webhook log found' }
