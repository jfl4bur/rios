<#
create_production_env_full.ps1
Creates a GitHub environment and configures required reviewers via gh CLI.

Usage (PowerShell):
  pwsh ./.github/scripts/create_production_env_full.ps1 -Owner jfl4bur -Repo rios -Env production -Reviewers jfl4bur,usuario1,usuario2,usuario3

Requirements:
- gh CLI installed and authenticated (gh auth login)
- The authenticated account must have admin permissions on the repository

This script will:
- Create the environment if missing
- Resolve each reviewer username to numeric user ID via the GitHub API
- Create the protection payload and apply it to the environment
- Print results and the final protection JSON
#>
param(
  [Parameter(Mandatory=$true)]
  [string]$Owner,

  [Parameter(Mandatory=$true)]
  [string]$Repo,

  [string]$Env = "production",

  [Parameter(Mandatory=$true)]
  [string[]]$Reviewers
)

function Fail([string]$msg) { Write-Error $msg; exit 1 }

# Check gh
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  Fail "gh CLI not found. Install from https://cli.github.com/ and authenticate (gh auth login)."
}

Write-Output "Checking gh authentication..."
try {
  gh auth status 2>$null | Out-Null
} catch {
  Fail "gh not authenticated. Run: gh auth login"
}

Write-Output "Checking repo permissions for $Owner/$Repo..."
$perms = gh api "/repos/$Owner/$Repo" --jq .permissions 2>&1
if ($LASTEXITCODE -ne 0) {
  Fail "Failed to query repo. Ensure the authenticated user has access and the repo exists. Raw output: $perms"
}
$permObj = $perms | ConvertFrom-Json
if (-not $permObj.admin) {
  Fail "Authenticated user does not have admin permissions on $Owner/$Repo. Need admin to set environment protection."
}

Write-Output "Creating environment '$Env' if missing..."
# Use empty JSON body to avoid type issues with wait_timer
$createOut = gh api --method PUT "/repos/$Owner/$Repo/environments/$Env" -f '{}' 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Warning "Warning: creating environment returned non-zero. Output: $createOut"
} else { Write-Output "Environment created/updated." }

# Normalize reviewers input: allow passing a single comma-separated string
if ($Reviewers.Count -eq 1 -and $Reviewers[0] -match ',') {
  $Reviewers = ($Reviewers -split ',') | ForEach-Object { $_.Trim() }
}

# Resolve user IDs
$ids = @()
foreach ($u in $Reviewers) {
  if ([string]::IsNullOrWhiteSpace($u)) { continue }
  Write-Output "Resolving user: $u"
  $idOut = gh api "/users/$u" --jq .id 2>&1
  if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($idOut)) {
    Write-Warning "Could not resolve user '$u'. Skipping. Raw: $idOut"
    continue
  }
  $ids += [int]$idOut
  Write-Output " -> $u -> $idOut"
}

if ($ids.Count -eq 0) { Fail "No valid reviewer IDs resolved; aborting." }

# Build payload
$reqReviewers = @()
foreach ($i in $ids) { $reqReviewers += @{ type = 'User'; id = $i } }
$payload = @{
  required_reviewers = $reqReviewers
  required_approving_review_count = 1
}
$tmp = [System.IO.Path]::GetTempFileName()
$payload | ConvertTo-Json -Depth 5 | Out-File -FilePath $tmp -Encoding utf8
Write-Output "Payload written to $tmp"
Get-Content $tmp | Write-Output

Write-Output "Applying protection to environment $Env..."
$applyOut = gh api --method PUT "/repos/$Owner/$Repo/environments/$Env/protection" --input $tmp 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Error "Failed to apply protection. Output:`n$applyOut"
  exit 2
}
Write-Output "Protection applied successfully. Response:`n$applyOut"

# cleanup
Remove-Item $tmp -ErrorAction SilentlyContinue
Write-Output "Done. Verify in GitHub UI: https://github.com/$Owner/$Repo/settings/environments/$Env"
