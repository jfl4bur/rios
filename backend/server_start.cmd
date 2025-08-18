@echo off
REM Script para iniciar el servidor Node y guardar logs
set NODE=%~dp0\..\node_modules\.bin\node
if exist %NODE% (
  echo Usando node local: %NODE%
) else (
  where node >nul 2>&1
  if errorlevel 1 (
    echo No se encontró node en PATH. Instala Node.js.
    exit /b 1
  ) else (
    for /f "usebackq tokens=*" %%i in (`where node`) do set NODE=%%i & goto :foundnode
  )
)
:foundnode
echo Iniciando servidor con %NODE%
%NODE% index.js 1>server.log 2>server.err

echo Logs en server.log y server.err
pause
