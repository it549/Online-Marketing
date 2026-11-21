@echo off
title Online-Marketing-Platform Production Server
setlocal
cd /d "%~dp0"

echo Stopping anything on port 3002...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 3002 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | Where-Object { $_ -gt 4 } | ForEach-Object { taskkill.exe /PID $_ /T /F }"

echo.
echo Applying database migrations and generating the Prisma client...
call npx prisma migrate deploy
if errorlevel 1 (
    echo.
    echo Database migration failed. Review the error above.
    pause
    exit /b 1
)
call npx prisma generate
if errorlevel 1 (
    echo.
    echo Prisma client generation failed. Review the error above.
    pause
    exit /b 1
)

echo.
rem The build is the RAM-heavy step (~3 GB), so skip it when nothing changed since the last
rem successful build. Pass "rebuild" (run-production.bat rebuild) to force a fresh build.
set "need_build=1"
if /i not "%~1"=="rebuild" (
    powershell -NoProfile -Command "$b = Get-Item '.next\BUILD_ID' -ErrorAction SilentlyContinue; if (-not $b) { exit 1 }; $files = @(Get-ChildItem src, public, prisma -Recurse -File -ErrorAction SilentlyContinue) + @(Get-Item next.config.ts, package.json, package-lock.json, tsconfig.json, postcss.config.mjs, .env* -ErrorAction SilentlyContinue); if ($files | Where-Object { $_.LastWriteTime -gt $b.LastWriteTime } | Select-Object -First 1) { exit 1 }; exit 0"
    if not errorlevel 1 set "need_build=0"
)
if "%need_build%"=="0" (
    echo No changes since the last build -- skipping the build. Use "run-production.bat rebuild" to force one.
) else (
    echo Building the production app...
    call npm run build
    if errorlevel 1 (
        echo.
        echo Production build failed. Review the error above.
        pause
        exit /b 1
    )
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
