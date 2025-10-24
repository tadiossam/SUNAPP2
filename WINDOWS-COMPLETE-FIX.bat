@echo off
cls
echo ============================================================
echo    GELAN TERMINAL - COMPLETE WINDOWS FIX
echo ============================================================
echo.

cd /d "%~dp0"

echo [1/6] Checking Node.js...
node --version || (
    echo ERROR: Node.js not installed!
    pause
    exit /b 1
)
echo.

echo [2/6] Checking files...
if not exist package.json (
    echo ERROR: package.json not found!
    echo Make sure you're in the correct folder.
    pause
    exit /b 1
)
echo ✓ package.json found
echo.

echo [3/6] Installing dependencies...
call npm install
echo.

echo [4/6] Creating .env file...
if exist .env (
    echo ✓ .env already exists
) else (
    (
        echo DATABASE_URL=postgresql://neondb_owner:npg_0h5gnNkiXBES@ep-royal-hill-aepzj67k.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require
        echo SESSION_SECRET=change-this-to-random-secret-key-12345
        echo PORT=6000
        echo NODE_ENV=development
    ) > .env
    echo ✓ Created .env file
)
echo.

echo [5/6] Checking .env contents...
type .env
echo.

echo [6/6] Starting server...
echo.
echo ============================================================
echo    Server will be available at: http://localhost:6000
echo.
echo    Login: ceo / ceo123
echo.
echo    Wait 30-60 seconds for Vite to build the frontend!
echo    Press Ctrl+C to stop
echo ============================================================
echo.

REM Set environment variables explicitly
set NODE_ENV=development
set DATABASE_URL=postgresql://neondb_owner:npg_0h5gnNkiXBES@ep-royal-hill-aepzj67k.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require
set SESSION_SECRET=change-this-to-random-secret-key-12345
set PORT=6000

REM Start the server with explicit environment variables
npx cross-env NODE_ENV=development PORT=6000 tsx server/index.ts

pause
