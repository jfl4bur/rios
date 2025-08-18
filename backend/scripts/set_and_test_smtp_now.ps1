# Sets SMTP env vars (Machine if admin, otherwise User) and runs the SMTP test script
$IsAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if ($IsAdmin) {
    Write-Output "IsAdmin=true -> setting Machine scope (requires admin)"
    [Environment]::SetEnvironmentVariable('CLEANUP_SMTP_USER','jflabur@gmail.com','Machine')
    [Environment]::SetEnvironmentVariable('CLEANUP_SMTP_PASS','gupgjdcwyrshaiqb','Machine')
    [Environment]::SetEnvironmentVariable('CLEANUP_ENABLE_EMAIL','1','Machine')
    [Environment]::SetEnvironmentVariable('CLEANUP_SMTP_HOST','smtp.gmail.com','Machine')
    [Environment]::SetEnvironmentVariable('CLEANUP_SMTP_PORT','587','Machine')
    [Environment]::SetEnvironmentVariable('CLEANUP_NOTIFY_TO','jflabur@gmail.com','Machine')
    Write-Output 'Set Machine vars'
} else {
    Write-Output "IsAdmin=false -> setting User scope and loading into current session"
    [Environment]::SetEnvironmentVariable('CLEANUP_SMTP_USER','jflabur@gmail.com','User')
    [Environment]::SetEnvironmentVariable('CLEANUP_SMTP_PASS','gupgjdcwyrshaiqb','User')
    [Environment]::SetEnvironmentVariable('CLEANUP_ENABLE_EMAIL','1','User')
    [Environment]::SetEnvironmentVariable('CLEANUP_SMTP_HOST','smtp.gmail.com','User')
    [Environment]::SetEnvironmentVariable('CLEANUP_SMTP_PORT','587','User')
    [Environment]::SetEnvironmentVariable('CLEANUP_NOTIFY_TO','jflabur@gmail.com','User')
    $env:CLEANUP_SMTP_USER = [Environment]::GetEnvironmentVariable('CLEANUP_SMTP_USER','User')
    $env:CLEANUP_SMTP_PASS = [Environment]::GetEnvironmentVariable('CLEANUP_SMTP_PASS','User')
    $env:CLEANUP_ENABLE_EMAIL = [Environment]::GetEnvironmentVariable('CLEANUP_ENABLE_EMAIL','User')
    $env:CLEANUP_SMTP_HOST = [Environment]::GetEnvironmentVariable('CLEANUP_SMTP_HOST','User')
    $env:CLEANUP_SMTP_PORT = [Environment]::GetEnvironmentVariable('CLEANUP_SMTP_PORT','User')
    $env:CLEANUP_NOTIFY_TO = [Environment]::GetEnvironmentVariable('CLEANUP_NOTIFY_TO','User')
    Write-Output 'Set User vars and loaded into session'
}
Write-Output "env session=" + $env:CLEANUP_SMTP_USER

# Run node test script
Write-Output 'Running node .\scripts\test_smtp_send.js ...'
$nodeCmd = "node .\scripts\test_smtp_send.js"
try {
    # Start-Process would hide output; use & to run and stream
    & node ".\scripts\test_smtp_send.js"
} catch {
    Write-Error "Error running test_smtp_send.js: $_"
    exit 1
}
Write-Output 'Done.'
