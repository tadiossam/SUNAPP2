@echo off
cd /d "%~dp0..\.."
echo.
echo ============================================================
echo    GELAN TERMINAL - STARTING SERVER
echo ============================================================
echo.
echo Server: http://localhost:6000
echo.
echo Login:
echo   CEO: ceo / ceo123
echo   Admin: admin / admin123
echo.
echo Press Ctrl+C to stop
echo.
echo ============================================================
echo.

REM Just run the server - it will load .env automatically with dotenv
npx tsx server/index.ts

echo.
echo ============================================================
echo Server stopped!
echo ============================================================
echo.
pause
