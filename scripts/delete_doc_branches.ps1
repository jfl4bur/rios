# Script seguro para borrar solo ramas doc*/docs* (local y remoto)
$ErrorActionPreference = 'Continue'
Set-Location 'C:\Users\jflabur\Desktop\rios'

Write-Host "Inicio: $(Get-Date)"

# Comprobar rama actual
$current = (git rev-parse --abbrev-ref HEAD 2>$null) -replace "\r|\n", ''
Write-Host "Rama actual: $current"
if ($current -ne 'main') {
    Write-Host 'Cambiando a main...'
    git checkout main
}

Write-Host 'Actualizando main desde origin...'
git fetch origin --prune

# Listar y borrar ramas locales doc*/docs*
$local = git branch --list 'doc*' 'docs*' | ForEach-Object { ($_ -replace '^\*','').Trim() } | Where-Object { $_ -ne '' } | Select-Object -Unique
if ($local -and $local.Count -gt 0) {
    Write-Host 'Ramas locales encontradas:'
    foreach ($b in $local) {
        Write-Host "  Borrando local: $b"
        git branch -D $b
    }
} else {
    Write-Host 'No hay ramas locales doc*/docs*'
}

# Listar y borrar ramas remotas origin/doc*/origin/docs*
$remote = git ls-remote --heads origin | ForEach-Object { ($_ -split '\s+')[1] -replace 'refs/heads/','' } | Where-Object { $_ -like 'doc*' -or $_ -like 'docs*' } | Select-Object -Unique
if ($remote -and $remote.Count -gt 0) {
    Write-Host 'Ramas remotas encontradas:'
    foreach ($b in $remote) {
        Write-Host "  Borrando remoto: $b"
        git push origin --delete $b
    }
} else {
    Write-Host 'No hay ramas remotas origin/doc* o origin/docs*'
}

Write-Host 'Finalizado.'
Write-Host "Fin: $(Get-Date)"
