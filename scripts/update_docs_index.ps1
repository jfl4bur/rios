#!/usr/bin/env pwsh
# update_docs_index.ps1
# Generates docs/INDEX.md from files present in docs/

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $scriptDir '..')
Set-Location $repoRoot

$docs = Get-ChildItem -Path .\docs -File -Filter *.md | Sort-Object Name
$lines = @()

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

$outPath = Join-Path $repoRoot 'docs\INDEX.md'
$lines -join "`n" | Out-File -FilePath $outPath -Encoding utf8 -Force
Write-Host "docs/INDEX.md actualizado en: $outPath"
