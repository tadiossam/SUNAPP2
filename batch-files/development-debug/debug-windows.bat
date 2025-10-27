@echo off
cd /d "%~dp0..\.."
echo.
echo ============================================================
echo    GELAN TERMINAL - DEBUG MODE
echo ============================================================
echo.

echo [1] Checking Node.js...
node --version
if errorlevel 1 (
    echo.
    echo ❌ ERROR: Node.js not found!
    echo Download from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)
echo.

echo [2] Checking current directory...
echo %CD%
echo.

echo [3] Checking if .env exists...
if exist .env (
    echo ✅ .env file found
    echo.
    echo .env contents:
    type .env
) else (
    echo ❌ .env file NOT found!
    echo Creating default .env file...
    (
        echo DATABASE_URL=postgresql://postgres:password@localhost:5432/gelan_terminal
        echo SESSION_SECRET=secret123
        echo PORT=6000
        echo NODE_ENV=development
    ) > .env
    echo ✅ Created .env file
    echo.
    echo ⚠️  IMPORTANT: Edit .env and add your DATABASE_URL
    notepad .env
)
echo.

echo [4] Checking if node_modules exists...
if exist node_modules (
    echo ✅ node_modules found
) else (
    echo ❌ node_modules NOT found!
    echo Run setup-windows.bat first!
    pause
    exit /b 1
)
echo.

echo [5] Starting server...
echo.
echo Server will be at: http://localhost:6000
echo.
echo If you see errors below, copy them and send to support!
echo.
echo ============================================================
echo.

REM Try to run the server
npx cross-env NODE_ENV=development PORT=6000 tsx server/index.ts

echo.
echo ============================================================
echo Server stopped!
echo ============================================================
echo.
pause
