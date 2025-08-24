#!/usr/bin/env pwsh
Set-Location 'C:\Users\jflabur\Desktop\rios'
$docs = Get-ChildItem -Path .\docs -File -Filter *.md | Sort-Object Name
$lines = @()
$lines += '```markdown'
$lines += '# Documentación del proyecto — Índice'
$lines += ''
$lines += 'Generado automáticamente. Contiene enlaces a los archivos dentro de `docs`.'
$lines += ''
$lines += ''
$lines += "Fecha de generación: $(Get-Date -Format 'yyyy-MM-dd')"
$lines += ''
$lines += '```'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root
$docs = Get-ChildItem -Path .\docs -File -Filter *.md | Sort-Object Name
$lines = @()

$lines += '```markdown'
$lines += '# Documentación del proyecto — Índice'
$lines += ''
$lines += 'Generado automáticamente. Contiene enlaces a los archivos dentro de `docs`.'
$lines += ''
foreach ($d in $docs) {
    $lines += "- [$($d.Name)](./$($d.Name))"
}
$lines += ''
$lines += "Fecha de generación: $(Get-Date -Format 'yyyy-MM-dd')"
$lines += ''
$lines += '```'

$lines -join "`n" | Out-File -FilePath .\docs\INDEX.md -Encoding utf8
Write-Host 'docs/INDEX.md actualizado.'
$lines += ''
$lines += "Fecha de generación: $(Get-Date -Format 'yyyy-MM-dd')"
$lines += ''
$lines += '```'

$lines -join "`n" | Out-File -FilePath .\docs\INDEX.md -Encoding utf8
Write-Host 'docs/INDEX.md actualizado.'
