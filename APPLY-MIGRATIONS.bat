@echo off
cls
echo.
echo ============================================================
echo    APPLY DATABASE MIGRATIONS
echo    Gelan Terminal Maintenance System
echo ============================================================
echo.
echo This will apply all pending SQL migrations from the "migrations" folder
echo to your PostgreSQL database configured in DATABASE_URL
echo.
echo WARNING: This will modify your database schema!
echo Make sure you have a backup if needed.
echo.
pause

echo.
echo Applying migrations to database...
echo.

npx drizzle-kit migrate

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================================
    echo    SUCCESS!
    echo ============================================================
    echo.
    echo All migrations have been applied to your database.
    echo Your database schema is now up to date!
    echo.
) else (
    echo.
    echo ============================================================
    echo    ERROR!
    echo ============================================================
    echo.
    echo Failed to apply migrations.
    echo Check the error messages above.
    echo.
)

echo.
pause
