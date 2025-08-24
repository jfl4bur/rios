#!/usr/bin/env pwsh
<#
ci_regen_and_push.ps1
Genera docs/INDEX.md y docs/STATUS.md, actualiza docs/LAST_SYNC.md,
hace backup de INDEX/STATUS manuales y commitea/pushea si hay cambios.

Ejecutar desde la raíz del repo o directamente el script:
pwsh -NoProfile -ExecutionPolicy Bypass -File .\scripts\ci_regen_and_push.ps1
#>

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $scriptDir '..')
Set-Location $repoRoot

Write-Host "Repo root: $repoRoot"

$index = Join-Path $repoRoot 'docs\INDEX.md'
$status = Join-Path $repoRoot 'docs\STATUS.md'
$lastSync = Join-Path $repoRoot 'docs\LAST_SYNC.md'

# Backup manual edits if exist (timestamped)
function Backup-IfExists($path) {
    if (Test-Path $path) {
        $ts = Get-Date -Format 'yyyyMMddHHmmss'
        $dest = "$path.manual.$ts"
        Copy-Item -LiteralPath $path -Destination $dest -Force
        Write-Host "Backed up $path -> $dest"
    }
}

Backup-IfExists $index
Backup-IfExists $status

# Run generators
Write-Host 'Generating STATUS.md from logs/checklist.md'
pwsh -NoProfile -ExecutionPolicy Bypass -File .\scripts\generate_checklist_status.ps1

Write-Host 'Generating INDEX.md from docs/'
pwsh -NoProfile -ExecutionPolicy Bypass -File .\scripts\update_docs_index.ps1

# Update LAST_SYNC.md
$now = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
"Última sincronización automatizada: $now" | Out-File -FilePath $lastSync -Encoding utf8 -Force
Write-Host "Updated $lastSync"

# Git add/commit/push
git add docs/* scripts/* README.md logs/checklist.md || true
$changed = git diff --cached --name-only
if ($changed) {
    Write-Host 'Changes to commit:'
    $changed | ForEach-Object { Write-Host "  $_" }
    git commit -m 'chore(docs): regenerate docs, update LAST_SYNC and backup manual indexes' || Write-Host 'Commit failed'
    git push origin main || Write-Host 'Push failed or missing credentials'
} else {
    Write-Host 'No docs changes to commit.'
}

Write-Host 'Done.'
