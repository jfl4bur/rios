param(
  [string]$TaskName = 'RiosCleanupUploads',
  [string]$Schedule = 'DAILY',
  [string]$Time = '03:00',
  [string]$WorkingDir = (Join-Path $PSScriptRoot '..'),
  [int]$CleanupDays = 30,
  [switch]$CleanupDryRun,
  [switch]$Preview
)

# Prefer using the run_cleanup.bat wrapper to avoid quoting pitfalls when Task Scheduler runs under SYSTEM
$batPath = Join-Path (Join-Path $PSScriptRoot '..') 'run_cleanup.bat'
if (-not (Test-Path $batPath)) {
  Write-Error "Wrapper not found at $batPath. Ensure run_cleanup.bat exists in the backend folder."; exit 1
}

$cmd = '"' + $batPath + '"'
$args = @()
if ($CleanupDays -ne 30) { $args += "--days=$CleanupDays" }
if ($CleanupDryRun) { $args += "--dry-run" }
$argText = $args -join ' '
if ($argText) { $cmd = "$cmd $argText" }
Write-Output "Registering scheduled task '$TaskName' to run: $cmd at $Time ($Schedule)"

if ($Preview) {
  Write-Output "Preview mode: the following registration will be attempted (not executed):"
  $previewAction = '/c "' + $batPath + ($argText ? ' ' + $argText : '') + '"'
  Write-Output "- PowerShell Register-ScheduledTask (preferred) with Action: cmd.exe $previewAction and Trigger: $Schedule @$Time"
  Write-Output "- Fallback: schtasks /Create /SC $Schedule /TN `"$TaskName`" /TR `"cmd.exe $previewAction`" /ST $Time /RL HIGHEST /F /RU SYSTEM"
  Write-Output "Note: place notification config in backend\\cleanup-notify.env to enable webhook/email notify; the wrapper will load and log it."
  Write-Output "If SYSTEM registration fails, fallback will attempt to register under the current user."
  exit 0
}

# Try to create with schtasks as SYSTEM (preferred)
function Test-IsElevated {
  try {
    $wi = [Security.Principal.WindowsIdentity]::GetCurrent()
    $wp = New-Object Security.Principal.WindowsPrincipal($wi)
    return $wp.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
  } catch { return $false }
}

# Prefer Register-ScheduledTask API when available
try {
  $canUsePS = (Get-Command -Name Register-ScheduledTask -ErrorAction SilentlyContinue) -ne $null
} catch { $canUsePS = $false }

if ($canUsePS) {
  try {
    Write-Output "Attempting Register-ScheduledTask (PowerShell API) as SYSTEM..."
  # Prefer running the batch directly so Task Scheduler passes args reliably
  $action = New-ScheduledTaskAction -Execute $batPath -Argument $argText -WorkingDirectory $WorkingDir
    if ($Schedule -eq 'DAILY') {
      $trigger = New-ScheduledTaskTrigger -Daily -At $Time
    } else {
      # basic fallback: use once at specified time if unsupported schedule value
      $trigger = New-ScheduledTaskTrigger -Once -At $Time
    }
    # Attempt to register as SYSTEM; this usually requires elevation
  Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -User 'SYSTEM' -RunLevel Highest -Force -ErrorAction Stop
    Write-Output "Scheduled task created as SYSTEM via Register-ScheduledTask."
    exit 0
  } catch {
    Write-Warning "Register-ScheduledTask failed or not permitted: $_"
  }
} else {
  Write-Output "Register-ScheduledTask not available on this system; will fallback to schtasks." 
}

# Fallback: create under current user (may require password on some systems)
try {
  $user = "$env:USERNAME"
  $taskRun = '"' + $batPath + ($argText ? ' ' + $argText : '') + '"'
  $schtasksCmd2 = "schtasks /Create /SC $Schedule /TN `"$TaskName`" /TR $taskRun /ST $Time /RL HIGHEST /F /RU $user"
  Write-Output "Executing fallback (current user): $schtasksCmd2"
  $res2 = cmd.exe /c $schtasksCmd2
  Write-Output $res2
  Write-Output "Scheduled task created for user $user."
  exit 0
} catch {
  Write-Error "Failed to register scheduled task: $_"
  if (-not (Test-IsElevated)) {
    Write-Output "Tip: open an elevated PowerShell (Run as Administrator) and re-run this script to register the task as SYSTEM."
  }
  Write-Output "Alternatively create the task manually using Task Scheduler: Action -> Start a program -> `$batPath` (Start in: $WorkingDir)."
  exit 1
}
