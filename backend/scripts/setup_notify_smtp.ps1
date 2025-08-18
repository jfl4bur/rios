<#
Interactively collect SMTP settings and write backend\cleanup-notify.env
Also offers to run a quick test-send using node (requires test_smtp_send.js available).

Usage: pwsh -NoProfile -File .\setup_notify_smtp.ps1
#>

function Read-YesNo($prompt, $defaultYes=$true) {
  $yn = Read-Host "$prompt [Y/n]"
  if ([string]::IsNullOrWhiteSpace($yn)) { return $defaultYes }
  return $yn.Trim().ToLower().StartsWith('y')
}

Write-Host "Configurar notificaciones SMTP para cleanup (escribe los valores cuando se te solicite)." -ForegroundColor Cyan

$smtpHost = Read-Host "SMTP host (p.ej. smtp.gmail.com)"
$smtpPort = Read-Host "SMTP port (p.ej. 587)" -AsInteger
$secureChoice = Read-Host "Usar TLS/SSL? (true/false) [false]"
if ([string]::IsNullOrWhiteSpace($secureChoice)) { $secureChoice = '0' }
$smtpSecure = if ($secureChoice -in @('1','true','True','True','yes')) { 1 } else { 0 }
$smtpUser = Read-Host "SMTP user (p.ej. tu@correo.com)"
Write-Host "Introduce la contraseña SMTP (se ocultará mientras escribes)" -ForegroundColor Yellow
$smtpPass = Read-Host -AsSecureString "SMTP password"
# convert SecureString to plain for writing to env (local only)
$ptr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($smtpPass)
try { $plainPass = [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) } finally { [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }

$from = Read-Host "From address (CLEANUP_SMTP_FROM) [default: rios@localhost]"
if ([string]::IsNullOrWhiteSpace($from)) { $from = 'rios@localhost' }
$notifyTo = Read-Host "Recipients comma-separated (CLEANUP_NOTIFY_TO)"
$allowGmail = Read-Host "Allow Gmail App Password override? (set CLEANUP_ALLOW_GMAIL_APP_PASS=1) [y/N]"
$allowGmailFlag = if ($allowGmail -and $allowGmail.Trim().ToLower().StartsWith('y')) { '1' } else { '' }

$envPath = Join-Path (Join-Path $PSScriptRoot '..') 'cleanup-notify.env'
Write-Host "Writing SMTP config to: $envPath" -ForegroundColor Green
@"
CLEANUP_ENABLE_EMAIL=1
CLEANUP_SMTP_HOST=$smtpHost
CLEANUP_SMTP_PORT=$smtpPort
CLEANUP_SMTP_SECURE=$smtpSecure
CLEANUP_SMTP_USER=$smtpUser
CLEANUP_SMTP_PASS=$plainPass
CLEANUP_SMTP_FROM=$from
CLEANUP_NOTIFY_TO=$notifyTo
CLEANUP_ALLOW_GMAIL_APP_PASS=$allowGmailFlag
"@ | Out-File -FilePath $envPath -Encoding UTF8 -Force

# Restrict permissions: only current user and Administrators
try {
  $acl = Get-Acl $envPath
  $acl.SetAccessRuleProtection($true, $false) | Out-Null
  $me = [System.Security.Principal.NTAccount]::new($env:USERDOMAIN + '\' + $env:USERNAME)
  $rule = New-Object System.Security.AccessControl.FileSystemAccessRule($me, 'FullControl', 'ContainerInherit,ObjectInherit', 'None', 'Allow')
  $acl.ResetAccessRule($rule)
  $admins = New-Object System.Security.Principal.NTAccount('BUILTIN','Administrators')
  $rule2 = New-Object System.Security.AccessControl.FileSystemAccessRule($admins, 'FullControl', 'ContainerInherit,ObjectInherit', 'None', 'Allow')
  $acl.AddAccessRule($rule2)
  Set-Acl -Path $envPath -AclObject $acl
  Write-Host "Permisos restringidos para $envPath" -ForegroundColor Green
} catch {
  Write-Warning "No fue posible ajustar ACLs automáticamente: $_"
}

# Optionally run a test send using node script if available
$testScript = Join-Path $PSScriptRoot 'test_smtp_send.js'
if (Test-Path $testScript) {
  if (Read-Host "Deseas ejecutar una prueba de envío ahora? (Y/n)" -eq 'Y') {
    Write-Host "Ejecutando test_smtp_send.js..." -ForegroundColor Cyan
    Push-Location (Join-Path $PSScriptRoot '..')
    try {
      node $testScript
    } catch {
      Write-Warning "Fallo al ejecutar test_smtp_send.js: $_"
    }
    Pop-Location
  }
} else {
  Write-Host "test_smtp_send.js no encontrado en scripts; puedes crear o usar el que ya existe en este repo." -ForegroundColor Yellow
}

Write-Host "Listo. Edita $envPath manualmente si necesitas ajustes. Protege este archivo (contiene credenciales)." -ForegroundColor Green
