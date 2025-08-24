<#
scripts/check_windows_env.ps1
Checks Windows dev environment for the project (Node, npm, Git, Flutter, Android SDK, VS Build Tools).
Does NOT perform installs; prints detected versions and suggested next steps.
#>

Write-Output "[INFO] Checking development environment..."

function Check-Command($name, $command) {
    $cmd = Get-Command $command -ErrorAction SilentlyContinue
    if ($cmd) {
        try { $ver = & $command --version 2>$null } catch { $ver = $null }
        if (-not $ver) {
            try { $ver = & $command -v 2>$null } catch { $ver = $null }
        }
        if ($ver) {
            Write-Output "[OK] ${name}: $ver"
        } else {
            Write-Output "[OK] ${name}:"
        }
        return $true
    } else {
    Write-Output "[MISSING] $name"
        return $false
    }
}

$results = @{}
$results.Node = Check-Command 'Node.js' 'node'
$results.Npm = Check-Command 'npm' 'npm'
$results.Git = Check-Command 'Git' 'git'
$results.Flutter = Check-Command 'Flutter' 'flutter'
$results.ADB = Check-Command 'adb' 'adb'
$results.Java = Check-Command 'Java (javac)' 'javac'

# Check Visual Studio Build Tools via vswhere (if present)
$vswhere = Get-Command vswhere -ErrorAction SilentlyContinue
if ($vswhere) {
    $vsinfo = & vswhere -latest -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath 2>$null
    if ($vsinfo) {
        Write-Output "[OK] Visual Studio Build Tools: found at $vsinfo"
        $results.VSBuildTools = $true
    } else {
        Write-Output "[MISSING] Visual Studio Build Tools (vswhere present but Build Tools not found)"
        $results.VSBuildTools = $false
    }
} else {
    Write-Output "[INFO] vswhere not found — cannot auto-detect Visual Studio Build Tools."
    $results.VSBuildTools = $false
}

# Environment variables for Android
$androidHome = $env:ANDROID_HOME
$androidSdkRoot = $env:ANDROID_SDK_ROOT
if ($androidHome -or $androidSdkRoot) {
    Write-Output "[OK] Android SDK environment variables: ANDROID_HOME=$androidHome ANDROID_SDK_ROOT=$androidSdkRoot"
    $results.AndroidEnv = $true
} else {
    Write-Output "[MISSING] ANDROID_HOME / ANDROID_SDK_ROOT not set"
    $results.AndroidEnv = $false
}

# Summary
Write-Output "`nSummary:"
$results.GetEnumerator() | ForEach-Object { $k=$_.Key; $v=$_.Value; if ($v) { Write-Output " - ${k}: OK" } else { Write-Output " - ${k}: MISSING / Needs attention" } }

Write-Output "`nSuggested next steps:"
Write-Output " - If Node/npm missing: install Node.js LTS from https://nodejs.org/ or use winget/chocolatey."
Write-Output " - If Git missing: install from https://git-scm.com/ or use winget."
Write-Output " - Visual Studio Build Tools (C++ toolchain) required for Flutter on Windows. Download: https://visualstudio.microsoft.com/downloads/ (search Build Tools)."
Write-Output " - Android SDK / Android Studio: https://developer.android.com/studio (set ANDROID_SDK_ROOT/ANDROID_HOME)."
Write-Output " - Flutter SDK: https://docs.flutter.dev/get-started/install/windows — follow Windows install guide and run 'flutter doctor' after install."
Write-Output " - For adb (Android platform-tools) ensure platform-tools are installed and on PATH (adb --version)."
Write-Output " - After installations, restart the shell and run: pwsh -NoProfile -Command 'flutter doctor' and 'flutter doctor --android-licenses'"

Write-Output "`nIf you want, puedo generar un script de instalación automático (winget/choco) — dime cómo prefieres proceder."
