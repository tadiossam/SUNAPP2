@echo off
setlocal enabledelayedexpansion

echo.
echo ============================================================
echo    GELAN TERMINAL - AUTOMATIC WINDOWS SETUP
echo ============================================================
echo.

REM Check Node.js installation
echo [CHECK] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed!
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo Choose the LTS version and restart this script.
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [OK] Node.js %NODE_VERSION% detected
echo.

REM Clean old installations
echo [STEP 1/6] Cleaning old installations...
if exist node_modules (
    echo Removing old node_modules folder...
    rmdir /s /q node_modules 2>nul
)
if exist package-lock.json (
    echo Removing package-lock.json...
    del /q package-lock.json 2>nul
)
echo [OK] Cleanup complete
echo.

REM Configure npm for Windows
echo [STEP 2/6] Configuring npm for Windows...
call npm config set msvs_version 2022
call npm config set python python3
echo [OK] npm configured
echo.

REM Install dependencies with Windows-friendly flags
echo [STEP 3/6] Installing dependencies...
echo This may take 2-5 minutes...
echo.
call npm install --legacy-peer-deps --no-optional
if errorlevel 1 (
    echo.
    echo [WARNING] Some dependencies had issues. Trying alternative method...
    echo.
    call npm install --force
    if errorlevel 1 (
        echo.
        echo [ERROR] Installation failed!
        echo.
        echo Common solutions:
        echo 1. Install Visual Studio Build Tools
        echo 2. Use WSL2 (Windows Subsystem for Linux)
        echo 3. Contact support
        echo.
        pause
        exit /b 1
    )
)
echo.
echo [OK] Dependencies installed
echo.

REM Handle bcrypt issues
echo [STEP 4/6] Checking for bcrypt compatibility...
call npm list bcrypt >nul 2>&1
if errorlevel 1 (
    echo [INFO] bcrypt has issues, switching to bcryptjs...
    call npm uninstall bcrypt 2>nul
    call npm install bcryptjs --save
    echo [OK] Using bcryptjs (Windows-compatible)
) else (
    echo [OK] bcrypt is working
)
echo.

REM Create .env file if it doesn't exist
echo [STEP 5/6] Setting up environment configuration...
if not exist .env (
    echo Creating .env file...
    (
        echo # Gelan Terminal Configuration
        echo.
        echo # Database - Replace with your PostgreSQL connection string
        echo DATABASE_URL=postgresql://postgres:password@localhost:5432/gelan_terminal
        echo.
        echo # OR use your Replit database remotely
        echo # DATABASE_URL=your_replit_database_url_here
        echo.
        echo # Session Secret - Change this to a random string
        echo SESSION_SECRET=change-this-to-random-secret-%RANDOM%-%RANDOM%
        echo.
        echo # Port
        echo PORT=5000
        echo.
        echo # Environment
        echo NODE_ENV=development
    ) > .env
    echo [OK] .env file created
    echo.
    echo ⚠️  IMPORTANT: Edit .env file and add your DATABASE_URL
    echo.
) else (
    echo [OK] .env file already exists
)
echo.

REM Create run script
echo [STEP 6/6] Creating easy-run script...
(
    echo @echo off
    echo echo Starting Gelan Terminal Application...
    echo echo.
    echo echo Server will be available at: http://localhost:5000
    echo echo.
    echo echo Login credentials:
    echo echo   CEO: ceo / ceo123
    echo echo   Admin: admin / admin123
    echo echo.
    echo echo Press Ctrl+C to stop the server
    echo echo.
    echo npm run dev
) > run-app.bat
echo [OK] Created run-app.bat
echo.

REM Final summary
echo ============================================================
echo    ✅ SETUP COMPLETE!
echo ============================================================
echo.
echo 📌 Next Steps:
echo.
echo 1. Edit .env file and configure your DATABASE_URL
echo    - Use Replit database remotely, OR
echo    - Install PostgreSQL locally
echo.
echo 2. Run the app:
echo    Double-click: run-app.bat
echo    Or run: npm run dev
echo.
echo 3. Open browser:
echo    http://localhost:5000
echo.
echo 4. Login:
echo    Username: ceo
echo    Password: ceo123
echo.
echo ============================================================
echo.

REM Show .env content
echo 📄 Current .env configuration:
echo ============================================================
type .env
echo ============================================================
echo.

echo Press any key to open .env file for editing...
pause >nul
notepad .env

echo.
echo ✅ You can now run the app by double-clicking: run-app.bat
echo.
pause
