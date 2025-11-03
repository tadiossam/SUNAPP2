@echo off
cls
echo ============================================================
echo    GELAN TERMINAL - WINDOWS FINAL FIX
echo ============================================================
echo.

cd /d "%~dp0..\.."

echo [Step 1] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not installed!
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)
node --version
echo ✓ Node.js is installed
echo.

echo [Step 2] Installing dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: npm install failed!
    pause
    exit /b 1
)
echo ✓ Dependencies installed
echo.

echo [Step 3] Setting environment variables...
set NODE_ENV=development
set DATABASE_URL=postgresql://neondb_owner:npg_0h5gnNkiXBES@ep-royal-hill-aepzj67k.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require
set SESSION_SECRET=change-this-to-random-secret-key-12345
set PORT=6000

echo ✓ NODE_ENV=%NODE_ENV%
echo ✓ PORT=%PORT%
echo ✓ DATABASE_URL=postgresql://neondb_owner:...
echo.

echo ============================================================
echo    STARTING SERVER
echo ============================================================
echo.
echo Important: Watch for these messages:
echo   1. "Environment: development (NODE_ENV=development)"
echo   2. "Starting Vite dev server..."
echo   3. "Vite dev server ready"
echo   4. "[express] serving on port 6000"
echo.
echo If you DON'T see "Starting Vite dev server...", the problem
echo is NODE_ENV is not set to "development"
echo.
echo After you see all messages, open: http://localhost:6000
echo.
echo Press Ctrl+C to stop the server
echo ============================================================
echo.

REM Use cross-env to ensure NODE_ENV is set on Windows
npx cross-env NODE_ENV=development PORT=6000 tsx server/index.ts

echo.
echo ============================================================
echo Server stopped
echo ============================================================
pause
