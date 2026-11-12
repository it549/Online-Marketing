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
echo Starting the production server at http://localhost:3002
call npm run start
set "exit_code=%ERRORLEVEL%"
if not "%exit_code%"=="0" (
    echo.
    echo Production server exited with code %exit_code%.
    pause
)
exit /b %exit_code%
