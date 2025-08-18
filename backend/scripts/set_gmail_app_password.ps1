<#
Uso: ejecutar en PowerShell elevando (Administrar) o el script se auto-elevra.
Este script pedirá tu cuenta Gmail y un App Password (16 chars) y configurará variables de entorno a nivel Machine:
  CLEANUP_ENABLE_EMAIL=1
  CLEANUP_ALLOW_GMAIL_APP_PASS=1
  CLEANUP_SMTP_HOST=smtp.gmail.com
  CLEANUP_SMTP_PORT=587
  CLEANUP_SMTP_USER=<tu email>
  CLEANUP_SMTP_PASS=<app password>
  CLEANUP_SMTP_SECURE=0
  CLEANUP_NOTIFY_TO=<destino>

ADVERTENCIA: Esto almacenará la contraseña en texto plano como variable de entorno del sistema. Es funcional pero tiene riesgos.
Considera usar Google App Password (recomendado) y/o un gestor de secretos. Para el Task Scheduler, las variables de Machine pueden ser leídas por tareas que se ejecuten con la cuenta SYSTEM o de máquina.
#>

function Test-IsAdmin {
  $current = [Security.Principal.WindowsIdentity]::GetCurrent()
  $principal = New-Object Security.Principal.WindowsPrincipal($current)
  return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (-not (Test-IsAdmin)) {
  Write-Output "Necesitas ejecutar esto como administrador. Intentando relanzar con elevación..."
  Start-Process pwsh -Verb RunAs -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" 
  exit 0
}

Write-Output "Ejecutando en modo elevado. Lee con atención las advertencias de seguridad."

# Pedir email y app password
$email = Read-Host "Introduce tu cuenta Gmail (ej. tu@ejemplo.com)"
Write-Output "Introduce el App Password (se abrirá un prompt seguro y no se mostrará en pantalla)."
$secure = Read-Host -AsSecureString "App Password (16 caracteres)"

# Convertir securestring a texto (necesario para variable de entorno). Solo se almacenará en Machine env si procedes.
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
$appPass = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)

$notify = Read-Host "Email de notificación (CLEANUP_NOTIFY_TO) (por defecto usar la misma cuenta)"
if (-not $notify) { $notify = $email }

Write-Output "\nSe van a establecer las siguientes variables de entorno a nivel Machine (requiere privilegios):"
Write-Output "  CLEANUP_ENABLE_EMAIL=1"
Write-Output "  CLEANUP_ALLOW_GMAIL_APP_PASS=1"
Write-Output "  CLEANUP_SMTP_HOST=smtp.gmail.com"
Write-Output "  CLEANUP_SMTP_PORT=587"
Write-Output "  CLEANUP_SMTP_USER=$email"
Write-Output "  CLEANUP_SMTP_PASS=******** (se guardará la contraseña en la variable de sistema)"
Write-Output "  CLEANUP_SMTP_SECURE=0"
Write-Output "  CLEANUP_NOTIFY_TO=$notify"

$confirm = Read-Host "¿Confirmas que deseas aplicar estas variables a nivel Machine? (Y/N)"
if ($confirm -notin @('Y','y','S','s')) { Write-Output 'Abortado por el usuario.'; exit 0 }

try {
  [Environment]::SetEnvironmentVariable('CLEANUP_ENABLE_EMAIL','1','Machine')
  [Environment]::SetEnvironmentVariable('CLEANUP_ALLOW_GMAIL_APP_PASS','1','Machine')
  [Environment]::SetEnvironmentVariable('CLEANUP_SMTP_HOST','smtp.gmail.com','Machine')
  [Environment]::SetEnvironmentVariable('CLEANUP_SMTP_PORT','587','Machine')
  [Environment]::SetEnvironmentVariable('CLEANUP_SMTP_USER',$email,'Machine')
  [Environment]::SetEnvironmentVariable('CLEANUP_SMTP_PASS',$appPass,'Machine')
  [Environment]::SetEnvironmentVariable('CLEANUP_SMTP_SECURE','0','Machine')
  [Environment]::SetEnvironmentVariable('CLEANUP_NOTIFY_TO',$notify,'Machine')

  Write-Output "Variables escritas con éxito a nivel Machine. IMPORTANTE: reinicia cualquier sesión/servicio que deba ver las variables (Task Scheduler usará las variables de máquina en ejecuciones futuras)."
  Write-Output "Para eliminar las variables más tarde (ejecutar en PowerShell elevado):"
  Write-Output "  [Environment]::SetEnvironmentVariable('CLEANUP_SMTP_PASS',$null,'Machine')"
  Write-Output "  [Environment]::SetEnvironmentVariable('CLEANUP_SMTP_USER',$null,'Machine')"
  Write-Output "  [Environment]::SetEnvironmentVariable('CLEANUP_ENABLE_EMAIL',$null,'Machine')"
  Write-Output "(repite para las demás variables si deseas borrarlas)"

  Write-Output "\nPrueba recomendada (dry-run):"
  Write-Output "  cd $PSScriptRoot\.."
  Write-Output "  node .\\scripts\\cleanup_uploads.js --days=7 --dry-run"
  Write-Output "O ejecutar el helper de prueba completo: .\\scripts\\run_cleanup_test.ps1 (te preguntará)"
} catch {
  Write-Error "Fallo al escribir variables: $_"
  exit 1
}

# Preguntar si ejecutar prueba SMTP inmediatamente
$runTest = Read-Host "\n¿Deseas ejecutar ahora una prueba SMTP para verificar las credenciales? (Y/N)"
if ($runTest -in @('Y','y','S','s')) {
  Write-Output "Ejecutando prueba SMTP...\n"
  try {
    # Ejecutar el script de prueba que utiliza las variables Machine
    & node "$PSScriptRoot\test_smtp_send.js"
    if ($LASTEXITCODE -eq 0) {
      Write-Output "Prueba SMTP completada correctamente."
    } else {
      Write-Error "La prueba SMTP devolvió código de salida: $LASTEXITCODE"
    }
  } catch {
    Write-Error "Fallo al ejecutar la prueba SMTP: $_"
  }
}
