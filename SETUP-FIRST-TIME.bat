@echo off
cls
echo ============================================================
echo    GELAN TERMINAL - FIRST TIME SETUP
echo    Sunshine Construction PLC
echo ============================================================
echo.

cd /d "%~dp0"

echo [1/4] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed!
    echo.
    echo Please download and install Node.js from:
    echo https://nodejs.org/
    echo.
    echo Install the LTS version (recommended for most users)
    pause
    exit /b 1
)
node --version
echo ✓ Node.js is installed
echo.

echo [2/4] Checking required files...
if not exist package.json (
    echo ERROR: package.json not found!
    echo Make sure you extracted all files from the zip.
    pause
    exit /b 1
)
echo ✓ Project files found
echo.

echo [3/4] Installing dependencies...
echo This may take 2-3 minutes...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install dependencies!
    pause
    exit /b 1
)
echo ✓ Dependencies installed successfully
echo.

echo [4/4] Creating environment file...
if exist .env (
    echo ✓ .env file already exists
) else (
    (
        echo DATABASE_URL=postgresql://neondb_owner:npg_0h5gnNkiXBES@ep-royal-hill-aepzj67k.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require
        echo SESSION_SECRET=change-this-to-random-secret-key-12345
        echo PORT=3000
        echo NODE_ENV=development
    ) > .env
    echo ✓ Created .env file
)
echo.

echo ============================================================
echo    SETUP COMPLETE!
echo ============================================================
echo.
echo To start the server, run:
echo   START-WINDOWS.bat
echo.
echo The application will be available at:
echo   http://localhost:3000
echo.
echo Default login credentials:
echo   Username: ceo
echo   Password: ceo123
echo.
pause
