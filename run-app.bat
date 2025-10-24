@echo off
echo.
echo ============================================================
echo    GELAN TERMINAL - STARTING SERVER
echo ============================================================
echo.
echo Server will start at: http://localhost:6000
echo.
echo Login credentials:
echo   CEO: ceo / ceo123
echo   Admin: admin / admin123
echo.
echo Press Ctrl+C to stop the server
echo.
echo ============================================================
echo.

REM Check if dependencies are installed
if not exist node_modules (
    echo.
    echo ❌ ERROR: Dependencies not installed!
    echo Please run setup-windows.bat first!
    echo.
    pause
    exit /b 1
)

REM Check if .env exists
if not exist .env (
    echo.
    echo ❌ ERROR: .env file not found!
    echo Please run setup-windows.bat first!
    echo.
    pause
    exit /b 1
)

REM Run the server with cross-env for Windows compatibility
npx cross-env NODE_ENV=development PORT=6000 tsx server/index.ts

REM If server stops, pause so user can see error
if errorlevel 1 (
    echo.
    echo ============================================================
    echo ❌ SERVER ERROR!
    echo ============================================================
    echo.
    echo If you see errors above, try running: debug-windows.bat
    echo.
)
pause
