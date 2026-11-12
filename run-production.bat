@echo off
title Online-Marketing-Platform Production Server
setlocal
cd /d "%~dp0"

echo Building the production app...
call npm run build
if errorlevel 1 (
    echo.
    echo Production build failed. Review the error above.
    pause
    exit /b 1
)

echo.
echo Checking port 3002...
powershell -NoProfile -Command "$ErrorActionPreference = 'Stop'; $listenerIds = @(Get-NetTCPConnection -LocalPort 3002 -State Listen | Select-Object -ExpandProperty OwningProcess -Unique); $stopFailed = $false; foreach ($listenerId in $listenerIds) { Write-Output ('Stopping PID ' + $listenerId + ' using port 3002.'); & taskkill.exe /PID $listenerId /T /F; if ($LASTEXITCODE -ne 0) { $stopFailed = $true } }; $remainingListeners = @(Get-NetTCPConnection -LocalPort 3002 -State Listen); if ($remainingListeners.Count -gt 0) { Write-Error 'Port 3002 is still in use.'; exit 1 }; Write-Output 'Port 3002 is available.'; if ($stopFailed) { Write-Warning 'A listener exited before it could be terminated.' }"
if errorlevel 1 (
    echo.
    echo Could not clear port 3002. Production server was not started.
    pause
    exit /b 1
)

echo.
echo Starting the production server at http://localhost:3002
call npm run start
set "exit_code=%ERRORLEVEL%"
if not "%exit_code%"=="0" (
    echo.
    echo Production server exited with code %exit_code%.
    pause
)
exit /b %exit_code%
