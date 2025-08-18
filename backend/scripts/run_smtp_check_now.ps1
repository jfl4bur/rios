# run_smtp_check_now.ps1
# Comprueba Machine/User, carga variables en sesión, ejecuta test_smtp_send.js y muestra el último log.
function Get-VarScopes($name) {
    $m = [Environment]::GetEnvironmentVariable($name,'Machine')
    $u = [Environment]::GetEnvironmentVariable($name,'User')
    return @{ Machine=$m; User=$u }
}

$vars = @('CLEANUP_SMTP_USER','CLEANUP_SMTP_PASS','CLEANUP_ENABLE_EMAIL','CLEANUP_SMTP_HOST','CLEANUP_SMTP_PORT','CLEANUP_NOTIFY_TO')
$info = @{}

$IsAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
Write-Output "IsAdmin=$IsAdmin"

foreach ($v in $vars) {
    $sc = Get-VarScopes $v
    $used = $null
    if ($sc.Machine) { $used = 'Machine' }
    elseif ($sc.User) { $used = 'User' }
    else { $used = $null }
    $info[$v] = @{ Machine = $sc.Machine; User = $sc.User; Effective = $used }
}

# Mostrar resumen (no imprimir la contraseña)
Write-Output "Summary of env vars (pass masked):"
foreach ($k in $info.Keys) {
    if ($k -eq 'CLEANUP_SMTP_PASS') {
        $presence = if ($info[$k].Machine -or $info[$k].User) { '(set)' } else { '(missing)' }
        Write-Output "$k = $presence  (Machine set? $([bool]$info[$k].Machine) ; User set? $([bool]$info[$k].User))"
    } else {
        $val = $info[$k].Machine ? $info[$k].Machine : $info[$k].User
        if (!$val) { $val = '(missing)' }
        Write-Output "$k = $val  (Machine? $([bool]$info[$k].Machine) ; User? $([bool]$info[$k].User))"
    }
}

# Cargar en session priorizando Machine > User
foreach ($v in $vars) {
    if (-not $env:$v) {
        $val = $info[$v].User
        if (-not $val) { $val = $info[$v].Machine }
        if ($val) { $env:$v = $val }
    }
}

Write-Output "Session env SAMPLE: CLEANUP_SMTP_USER=$env:CLEANUP_SMTP_USER ; CLEANUP_SMTP_PASS present? $([bool]$env:CLEANUP_SMTP_PASS)"

# Ejecutar el test de Node
Write-Output "Ejecutando: node .\\scripts\\test_smtp_send.js"
& node .\scripts\test_smtp_send.js 2>&1 | ForEach-Object { Write-Output $_ }
$ec = $LASTEXITCODE
Write-Output "node exit code: $ec"

# Mostrar último log smtp-test-*.json si existe
$f = Get-ChildItem -Path .\logs -Filter 'smtp-test-*.json' -File -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if ($f) {
    Write-Output "-- latest log: $($f.FullName) --"
    Get-Content $f.FullName -Raw
} else {
    Write-Output "No smtp-test-*.json found in ./logs"
}
