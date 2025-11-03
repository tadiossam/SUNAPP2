@echo off
cd /d "%~dp0..\.."
cls
echo.
echo ============================================================
echo    GELAN TERMINAL - WINDOWS LAUNCHER
echo ============================================================
echo.
echo Checking setup...
echo.

if not exist .env (
    echo ERROR: .env file not found!
    echo.
    echo Please create .env file with:
    echo DATABASE_URL=your-database-url
    echo SESSION_SECRET=secret123
    echo PORT=6000
    echo NODE_ENV=development
    echo.
    pause
    exit /b 1
)

if not exist node_modules\dotenv (
    echo ERROR: dotenv package not installed!
    echo.
    echo Run: npm install dotenv
    echo.
    pause
    exit /b 1
)

echo Configuration found!
echo Starting server...
echo.
echo Server will be at: http://localhost:6000
echo.
echo Press Ctrl+C to stop the server
echo.
echo ============================================================
echo.

npx tsx server/index.ts

if errorlevel 1 (
    echo.
    echo ============================================================
    echo ERROR: Server failed to start!
    echo ============================================================
    echo.
    echo Check the error message above.
    echo.
    echo Common fixes:
    echo 1. Make sure .env has valid DATABASE_URL
    echo 2. Make sure dotenv is installed: npm install dotenv
    echo 3. Make sure server/index.ts has dotenv code at the top
    echo.
    echo See: MANUAL-FIX-INSTRUCTIONS.txt
    echo.
    pause
)
