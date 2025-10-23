@echo off
echo.
echo ============================================================
echo    GELAN TERMINAL - STARTING SERVER
echo ============================================================
echo.
echo Server: http://localhost:5000
echo.
echo Login:
echo   CEO: ceo / ceo123
echo   Admin: admin / admin123
echo.
echo Press Ctrl+C to stop
echo.
echo ============================================================
echo.

REM Set environment variables for Windows
set NODE_ENV=development

REM Load .env file if it exists
if exist .env (
    for /f "delims== tokens=1,2" %%a in (.env) do (
        if not "%%a"=="" if not "%%b"=="" set %%a=%%b
    )
)

REM Run the application
npx tsx server/index.ts
