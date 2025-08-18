@echo off
SET WORKDIR=C:\Users\jflabur\Desktop\rios\backend
cd /d "%WORKDIR%"
if not exist "%WORKDIR%\\logs" mkdir "%WORKDIR%\\logs"

REM --- rotate previous log into a timestamped file if it exists and is non-empty ---
for /f "usebackq tokens=*" %%t in (`powershell -NoProfile -Command "Get-Date -Format 'yyyyMMdd-HHmmss'"`) do set TIMESTAMP=%%t
if exist "%WORKDIR%\\logs\\cleanup.log" (
  for %%I in ("%WORKDIR%\\logs\\cleanup.log") do (
    if %%~zI GTR 0 copy "%WORKDIR%\\logs\\cleanup.log" "%WORKDIR%\\logs\\cleanup-%%TIMESTAMP%%.log" >nul
  )
)

REM --- keep only the most recent 14 rotated logs (cleanup-YYYYMMDD-*.log) ---
powershell -NoProfile -Command "Get-ChildItem -Path '%WORKDIR%\\logs\\cleanup-*.log' -File | Sort-Object LastWriteTime -Descending | Select-Object -Skip 14 | Remove-Item -Force -ErrorAction SilentlyContinue"

REM --- load optional notification env (cleanup-notify.env) ---
if exist "%WORKDIR%\\cleanup-notify.env" (
	echo Loading cleanup-notify.env >> "%WORKDIR%\\logs\\cleanup.log"
	for /f "usebackq tokens=1* delims==" %%A in (`type "%WORKDIR%\\cleanup-notify.env" ^| findstr /r /v "^\s*#"`) do (
		set "%%A=%%B"
	)
	echo cleanup-notify.env loaded >> "%WORKDIR%\\logs\\cleanup.log"
)

echo ==== %DATE% %TIME% ==== >> "%WORKDIR%\\logs\\cleanup.log"
echo PATH=%PATH% >> "%WORKDIR%\\logs\\cleanup.log"

REM Preferir npm.cmd en Program Files
if exist "%ProgramFiles%\\nodejs\\npm.cmd" (
	"%ProgramFiles%\\nodejs\\npm.cmd" run cleanup:uploads -- %* >> "%WORKDIR%\\logs\\cleanup.log" 2>&1
) else if exist "%ProgramFiles(x86)%\\nodejs\\npm.cmd" (
	"%ProgramFiles(x86)%\\nodejs\\npm.cmd" run cleanup:uploads -- %* >> "%WORKDIR%\\logs\\cleanup.log" 2>&1
) else (
	echo npm not found >> "%WORKDIR%\\logs\\cleanup.log"
)
echo ExitCode:%ERRORLEVEL% >> "%WORKDIR%\\logs\\cleanup.log"
