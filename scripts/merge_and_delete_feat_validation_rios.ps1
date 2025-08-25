#!/usr/bin/env pwsh
<##
Safe script: merge origin/feat/validation-rios into origin/main and delete the branch if merge succeeds.
Does NOT create permanent branches; uses temporary refs and aborts on conflicts.
Usage (from repo root):
pwsh -NoProfile -ExecutionPolicy Bypass -File .\scripts\merge_and_delete_feat_validation_rios.ps1
##>

$ErrorActionPreference = 'Stop'
$repo = Get-Location
Write-Host "Repo root: $repo"
# Fetch and prune
git fetch origin --prune

# Check remote exists
$ls = git ls-remote --heads origin feat/validation-rios
if ([string]::IsNullOrEmpty($ls)) {
    Write-Host "REMOTE_NOT_FOUND: origin/feat/validation-rios does not exist. Nothing to do."
    exit 0
}

# Prepare local main to match origin/main
git checkout -B main origin/main
git reset --hard origin/main

# Try merge (non-interactive). If conflict occurs, abort and exit non-zero.
git merge --no-ff origin/feat/validation-rios -m "chore(merge): merge feat/validation-rios into main" 2>&1 | Tee-Object -Variable mergeOut
if ($LASTEXITCODE -ne 0) {
    Write-Host "MERGE_FAILED"
    Write-Host $mergeOut
    Write-Host "Attempting to abort merge (if any)..."
    git merge --abort 2>$null
    Write-Host "Merge aborted. No changes pushed."
    exit 2
}

# Push main
Write-Host "Merge succeeded locally. Pushing main to origin..."
git push origin main
if ($LASTEXITCODE -ne 0) { Write-Host "PUSH_MAIN_FAILED"; exit 3 }

# Delete remote branch
Write-Host "Deleting remote branch origin/feat/validation-rios..."
git push origin --delete feat/validation-rios || Write-Host "REMOTE_DELETE_FAILED"
# Delete local branch if present
git branch -D feat/validation-rios -ErrorAction SilentlyContinue

Write-Host "DONE: merged and remote branch deleted (if existed)."
exit 0
