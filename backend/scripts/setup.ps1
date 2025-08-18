# setup.ps1 - minimal setup for backend (Windows)
Write-Output "Running backend setup (Windows)"
Set-Location -LiteralPath (Split-Path -Parent $MyInvocation.MyCommand.Definition)
Set-Location -LiteralPath ..

# Ensure node modules
if (!(Test-Path node_modules)) {
    Write-Output "Installing npm dependencies..."
    npm install
} else {
    Write-Output "node_modules already present"
}

# Create uploads and logs dirs
$dirs = @('uploads','logs')
foreach ($d in $dirs) {
    $p = Join-Path -Path (Get-Location) -ChildPath $d
    if (!(Test-Path $p)) { New-Item -ItemType Directory -Path $p | Out-Null; Write-Output "Created $p" } else { Write-Output "$p exists" }
}

# Create sqlite file if not exists
$db = Join-Path -Path (Get-Location) -ChildPath 'data\rios.db'
if (!(Test-Path (Split-Path $db -Parent))) { New-Item -ItemType Directory -Path (Split-Path $db -Parent) | Out-Null }
if (!(Test-Path $db)) {
    Write-Output "Creating SQLite DB file..."
    New-Item -ItemType File -Path $db | Out-Null
} else { Write-Output "DB file exists: $db" }

Write-Output "Setup complete. Run: npm run dev"
