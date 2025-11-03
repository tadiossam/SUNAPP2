@echo off
cls
echo ============================================================
echo    SETUP LOCAL DATABASE
echo    Create Tables and Add Users
echo ============================================================
echo.

cd /d "%~dp0..\.."

echo Make sure you have:
echo   1. PostgreSQL installed
echo   2. Created a database named "gelan_terminal"
echo   3. Updated .env with your local DATABASE_URL
echo.
pause

echo.
echo [Step 1/2] Creating database tables...
echo.
call npm run db:push
if errorlevel 1 (
    echo.
    echo ERROR: Failed to create tables!
    echo Check that PostgreSQL is running and DATABASE_URL is correct.
    pause
    exit /b 1
)

echo.
echo [Step 2/2] Adding default CEO user...
echo.
npx tsx scripts/seed-local.ts
if errorlevel 1 (
    echo.
    echo ERROR: Failed to seed database!
    pause
    exit /b 1
)

echo.
echo ============================================================
echo    DATABASE SETUP COMPLETE!
echo ============================================================
echo.
echo You can now login with:
echo   Username: ceo
echo   Password: ceo123
echo.
echo Run START-WINDOWS.bat to start the server
echo.
pause
