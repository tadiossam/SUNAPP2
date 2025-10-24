@echo off
cls
echo ============================================================
echo    GELAN TERMINAL MAINTENANCE SYSTEM
echo    Sunshine Construction PLC
echo ============================================================
echo.

cd /d "%~dp0"

echo Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not installed!
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)
echo ✓ Node.js installed
echo.

echo Installing dependencies...
call npm install >nul 2>&1
echo ✓ Dependencies ready
echo.

echo ============================================================
echo    SERVER STARTING
echo ============================================================
echo.
echo Server will be available at: http://localhost:3000
echo.
echo Default Login:
echo   Username: ceo
echo   Password: ceo123
echo.
echo Press Ctrl+C to stop the server
echo ============================================================
echo.

npx cross-env NODE_ENV=development PORT=3000 tsx server/index.ts
