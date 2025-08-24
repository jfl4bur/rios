# Move root-level .log and .txt files into logs/ and commit the changes
$root = (Get-Location).Path
$files = Get-ChildItem -Path $root -File -Include *.log,*.txt | Where-Object { $_.DirectoryName -eq $root }
if (-not (Test-Path (Join-Path $root 'logs'))) {
    New-Item -ItemType Directory -Path (Join-Path $root 'logs') | Out-Null
}
if ($files.Count -eq 0) {
    Write-Host 'No root .log/.txt files to move.'
    exit 0
}
foreach ($file in $files) {
    $name = $file.Name
    $dest = Join-Path $root 'logs'
    try {
        if (Test-Path (Join-Path $dest $name)) {
            $bak = $name + '.bak.' + (Get-Date -Format yyyyMMddHHmmss)
            Move-Item -LiteralPath (Join-Path $dest $name) -Destination (Join-Path $dest $bak) -Force
            Write-Host "Existing logs/$name moved to logs/$bak"
        }
        & git mv --force -- $name logs/
        Write-Host "Moved: $name -> logs/$name"
    } catch {
    Write-Host ("git mv failed for {0}: {1}; falling back to Move-Item" -f $name, $_.Exception.Message)
        Move-Item -LiteralPath $name -Destination $dest -Force
    }
}

& git add -A
if (& git commit -m 'chore(docs): move root logs and txt files into logs/ and update docs/checklist.md') {
    Write-Host 'Committed changes.'
} else {
    Write-Host 'No changes to commit.'
}

if (& git push -u origin doc/move-checklist-and-logs) {
    Write-Host 'Pushed branch doc/move-checklist-and-logs.'
} else {
    Write-Host 'Push failed or already up-to-date.'
}

Write-Host 'Done.'
