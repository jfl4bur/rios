<#
scripts/check_windows_env_full.ps1
More robust Windows environment checker: runs commands capturing stdout+stderr and prints an easy-to-read report.
Intended to be executed and redirected to a file to preserve full output.
#>

Write-Output "[INFO] Starting full environment check: $(Get-Date -Format o)"

$checks = @(
    @{ name='Node.js'; cmd='node'; args='--version' },
    @{ name='npm'; cmd='npm'; args='--version' },
    @{ name='Git'; cmd='git'; args='--version' },
    @{ name='Flutter'; cmd='flutter'; args='--version' },
    @{ name='Java (javac)'; cmd='javac'; args='-version' },
    @{ name='adb (platform-tools)'; cmd='adb'; args='version' }
)

foreach ($c in $checks) {
    $name = $c.name
    $cmd = $c.cmd
    $arguments = $c.args
    Write-Output "\n=== $name check ==="
    $path = Get-Command $cmd -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source -ErrorAction SilentlyContinue
    if ($path) {
        Write-Output "Found: $path"
        # try running preferred args, capture both stdout and stderr
        try {
            $proc = Start-Process -FilePath $path -ArgumentList $arguments -NoNewWindow -RedirectStandardOutput (New-TemporaryFile) -RedirectStandardError (New-TemporaryFile) -PassThru -Wait
        } catch {
            # Fallback: invoke and capture
            $combined = & $cmd $args 2>&1
            if ($combined) { Write-Output "Output: $combined" } else { Write-Output "Output: (no output)" }
            continue
        }
        # If we reached here, attempt simple call as well
        $combined2 = & $cmd $arguments 2>&1
        if ($combined2) { Write-Output "Output: $combined2" } else { Write-Output "Output: (no output)" }
    } else {
        Write-Output "Not found on PATH: $cmd"
    }
}

# vswhere (Visual Studio detection)
Write-Output "\n=== Visual Studio / Build Tools check (vswhere) ==="
$vswherePath = Get-Command vswhere -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source -ErrorAction SilentlyContinue
if ($vswherePath) {
    Write-Output "vswhere found: $vswherePath"
    $vsout = & $vswherePath -latest -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath 2>&1
    if ($vsout) { Write-Output "vswhere output: $vsout" } else { Write-Output "vswhere ran but returned no installation path (component may be missing)" }
} else {
    Write-Output "vswhere not found on PATH"
}

# Android env vars
Write-Output "\n=== Android environment variables ==="
Write-Output "ANDROID_HOME = $env:ANDROID_HOME"
Write-Output "ANDROID_SDK_ROOT = $env:ANDROID_SDK_ROOT"
Write-Output "JAVA_HOME = $env:JAVA_HOME"

# Try locating Android SDK platform-tools adb if not found earlier
if (-not (Get-Command adb -ErrorAction SilentlyContinue)) {
    Write-Output "adb not found on PATH; trying common SDK locations..."
    $possible = @(
        "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe",
        "$env:ProgramFiles\Android\Android Studio\platform-tools\adb.exe"
    )
    foreach ($p in $possible) { if (Test-Path $p) { Write-Output "Found adb at $p"; break } }
}

# Summary
Write-Output "\n=== SUMMARY ==="
Write-Output "Run completed: $(Get-Date -Format o)"
Write-Output "Note: this script tries multiple methods; if a tool prints to stderr, its output will be captured above."

Write-Output "\nEnd of report."
