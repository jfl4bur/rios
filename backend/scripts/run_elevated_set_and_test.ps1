$log = 'C:\Users\jflabur\Desktop\rios\backend\logs\smtp-elevated-output.txt'
if (!(Test-Path (Split-Path $log -Parent))) { New-Item -ItemType Directory -Path (Split-Path $log -Parent) -Force | Out-Null }

[Environment]::SetEnvironmentVariable('CLEANUP_SMTP_USER','jflabur@gmail.com','Machine')
[Environment]::SetEnvironmentVariable('CLEANUP_SMTP_PASS','gupgjdcwyrshaiqb','Machine')
[Environment]::SetEnvironmentVariable('CLEANUP_ENABLE_EMAIL','1','Machine')
[Environment]::SetEnvironmentVariable('CLEANUP_SMTP_HOST','smtp.gmail.com','Machine')
[Environment]::SetEnvironmentVariable('CLEANUP_SMTP_PORT','587','Machine')
[Environment]::SetEnvironmentVariable('CLEANUP_NOTIFY_TO','jflabur@gmail.com','Machine')

Set-Location 'C:\Users\jflabur\Desktop\rios\backend'

"=== Running test_smtp_send.js ===" | Out-File -FilePath $log -Encoding utf8
# Run Node test and append stdout/stderr to log
node .\scripts\test_smtp_send.js 2>&1 | Out-File -FilePath $log -Append -Encoding utf8

"=== Latest smtp-test-*.json (if present) ===" | Out-File -FilePath $log -Append -Encoding utf8
$f = Get-ChildItem -Path .\logs -Filter 'smtp-test-*.json' -File -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if ($f) { Get-Content $f.FullName -Raw | Out-File -FilePath $log -Append -Encoding utf8 } else { "No smtp-test-*.json found" | Out-File -FilePath $log -Append -Encoding utf8 }

"=== Finished ===" | Out-File -FilePath $log -Append -Encoding utf8
Write-Output "Wrote log to: $log"
