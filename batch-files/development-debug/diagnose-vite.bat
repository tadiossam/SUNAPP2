@echo off
echo ============================================================
echo    VITE DIAGNOSTIC
echo ============================================================
echo.

cd /d "%~dp0"

echo [1] Checking NODE_ENV...
set NODE_ENV=development
echo NODE_ENV=%NODE_ENV%
echo.

echo [2] Checking client files...
if exist client\index.html (
    echo ✓ client\index.html exists
) else (
    echo ✗ client\index.html MISSING!
)

if exist client\src\main.tsx (
    echo ✓ client\src\main.tsx exists
) else (
    echo ✗ client\src\main.tsx MISSING!
)

if exist vite.config.ts (
    echo ✓ vite.config.ts exists
) else (
    echo ✗ vite.config.ts MISSING!
)
echo.

echo [3] Testing Vite directly...
npx vite --version
echo.

echo [4] Trying to run Vite dev server...
echo This should open a dev server. Press Ctrl+C to stop.
echo.
npx vite

pause
