#!/usr/bin/env pwsh
# generate_checklist_status.ps1
# Generates docs/STATUS.md from logs/checklist.md

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $scriptDir '..')
$checklistPath = Join-Path $repoRoot 'logs\checklist.md'
$outPath = Join-Path $repoRoot 'docs\STATUS.md'

if (-not (Test-Path $checklistPath)) {
    Write-Error "No se encuentra $checklistPath"
    exit 1
}

$content = Get-Content -LiteralPath $checklistPath -ErrorAction Stop
$total = 0
$done = 0

foreach ($line in $content) {
    if ($line -match '^-\s*\[( |x|~)\]') {
        $total++
        if ($line -match '\[x\]') { $done++ }
    }
}

$pending = $total - $done

$summary = @()
$summary += '# Estado del checklist maestro'
$summary += ''
$summary += "Fecha: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
$summary += ''
$summary += "- Total ítems: $total"
$summary += "- Completados: $done"
$summary += "- Pendientes: $pending"
$summary += ''
$summary += '---'
$summary += ''
$summary += 'Este archivo se genera a partir de `logs/checklist.md`. Para regenerarlo, ejecutar `pwsh .\scripts\generate_checklist_status.ps1`'

$summary -join "`n" | Out-File -FilePath $outPath -Encoding utf8 -Force
Write-Host "docs/STATUS.md actualizado en: $outPath"
