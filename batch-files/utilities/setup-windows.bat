@echo off
cd /d "%~dp0..\.."
echo.
echo ============================================================
echo    GELAN TERMINAL - WINDOWS SETUP
echo ============================================================
echo.

echo [1/5] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found!
    echo Install from: https://nodejs.org/
    pause
    exit /b 1
)
node --version
echo.

echo [2/5] Cleaning old installations...
if exist node_modules rmdir /s /q node_modules 2>nul
if exist package-lock.json del /q package-lock.json 2>nul
echo Done!
echo.

echo [3/5] Installing dependencies (2-5 minutes)...
call npm install --legacy-peer-deps --no-optional
if errorlevel 1 (
    echo Trying alternative method...
    call npm install --force
)
echo Done!
echo.

echo [4/5] Fixing bcrypt for Windows...
call npm uninstall bcrypt 2>nul
call npm install bcryptjs
node fix-bcrypt-windows.cjs
echo Done!
echo.

echo [5/5] Creating configuration files...
if not exist .env (
    (
        echo # Gelan Terminal Configuration
        echo.
        echo # OPTION 1: Use Replit Database Remotely (Recommended)
        echo # Get this from Replit: Tools -^> Secrets -^> DATABASE_URL
        echo DATABASE_URL=postgresql://your-replit-database-url-here
        echo.
        echo # OPTION 2: Use Local PostgreSQL
        echo # DATABASE_URL=postgresql://postgres:password@localhost:5432/gelan_terminal
        echo.
        echo # Session Secret
        echo SESSION_SECRET=change-this-to-random-secret-key-12345
        echo.
        echo # Port
        echo PORT=6000
        echo.
        echo # Environment
        echo NODE_ENV=development
    ) > .env
    echo Created .env file
)
echo.

echo ============================================================
echo    ✅ SETUP COMPLETE!
echo ============================================================
echo.
echo 📌 NEXT STEPS:
echo.
echo 1. Edit .env file (opening now...)
echo    Add your DATABASE_URL
echo.
echo 2. Run the app:
echo    Double-click: run-app.bat
echo.
echo 3. Open browser:
echo    http://localhost:6000
echo.
echo 4. Login:
echo    ceo / ceo123  OR  admin / admin123
echo.
echo ============================================================
echo.
pause
notepad .env
