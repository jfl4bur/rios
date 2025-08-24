#!/usr/bin/env pwsh
Set-Location 'C:\Users\jflabur\Desktop\rios'

$checklistPath = '.\logs\checklist.md'
if (-not (Test-Path $checklistPath)) {
    Write-Error "No se encuentra $checklistPath"
    exit 1
}

$content = Get-Content $checklistPath
$total = 0
$done = 0
$linesOut = @()

foreach ($line in $content) {
    if ($line -match '^- \[( |x|~)\]') {
        $total++
        if ($line -match '\[x\]') { $done++ }
    }
}

$pending = $total - $done

$summary = @()
$summary += "# Estado del checklist maestro"
$summary += ""
$summary += "Fecha: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
$summary += ""
$summary += "- Total ítems: $total"
$summary += "- Completados: $done"
$summary += "- Pendientes: $pending"
$summary += ""
$summary += "---"
$summary += ""
$summary += "Este archivo se genera a partir de `logs/checklist.md`. Para regenerarlo, ejecutar `pwsh .\scripts\generate_checklist_status.ps1`"

$summary -join "`n" | Out-File -FilePath .\docs\STATUS.md -Encoding utf8
Write-Host 'docs/STATUS.md actualizado.'
