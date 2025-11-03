@echo off
cd /d "%~dp0..\.."
echo.
echo ============================================================
echo    QUICK INSTALLATION CHECK
echo ============================================================
echo.

echo Checking Node.js installation...
node --version
if errorlevel 1 (
    echo.
    echo ❌ Node.js NOT installed!
    echo Download from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)
echo.

echo Current folder:
echo %CD%
echo.

echo Checking for required files...
echo.

if exist package.json (
    echo ✅ package.json found
) else (
    echo ❌ package.json NOT found - wrong folder?
)

if exist .env (
    echo ✅ .env found
) else (
    echo ⚠️  .env NOT found
)

if exist node_modules (
    echo ✅ node_modules found
) else (
    echo ❌ node_modules NOT found - run setup-windows.bat
)

if exist server\index.ts (
    echo ✅ server\index.ts found
) else (
    echo ❌ server\index.ts NOT found - wrong folder?
)

echo.
echo ============================================================
echo.

if not exist node_modules (
    echo ⚠️  DEPENDENCIES NOT INSTALLED!
    echo.
    echo Run this first: setup-windows.bat
    echo.
) else if not exist .env (
    echo ⚠️  CONFIGURATION FILE MISSING!
    echo.
    echo Run this first: setup-windows.bat
    echo.
) else (
    echo ✅ Everything looks good!
    echo.
    echo Try running: debug-super.bat
    echo.
)

pause
