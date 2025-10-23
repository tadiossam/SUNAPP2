@echo off
echo.
echo ============================================================
echo    GELAN TERMINAL - WINDOWS SETUP
echo ============================================================
echo.

echo [1/4] Cleaning old installations...
if exist node_modules rmdir /s /q node_modules 2>nul
if exist package-lock.json del /q package-lock.json 2>nul
echo Done!
echo.

echo [2/4] Installing dependencies...
echo This may take 2-5 minutes...
call npm install --legacy-peer-deps
echo Done!
echo.

echo [3/4] Fixing bcrypt for Windows...
call npm uninstall bcrypt
call npm install bcryptjs
node fix-bcrypt-windows.js
echo Done!
echo.

echo [4/4] Creating .env file...
if not exist .env (
    echo DATABASE_URL=postgresql://localhost/gelan_terminal> .env
    echo SESSION_SECRET=change-this-secret-key-12345>> .env
    echo PORT=5000>> .env
    echo NODE_ENV=development>> .env
    echo.
    echo ⚠️  Please edit .env and add your database connection!
)
echo.

echo ============================================================
echo    ✅ SETUP COMPLETE!
echo ============================================================
echo.
echo Next steps:
echo 1. Edit .env file (will open now)
echo 2. Run: run-app.bat
echo 3. Open: http://localhost:5000
echo.
pause
notepad .env
