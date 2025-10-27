@echo off
cls
echo.
echo ============================================================
echo    GENERATE DATABASE MIGRATION
echo    Gelan Terminal Maintenance System
echo ============================================================
echo.
echo This will generate SQL migration files in the "migrations" folder
echo based on changes you made to shared/schema.ts
echo.
pause

echo.
echo Generating migration SQL files...
echo.

npx drizzle-kit generate

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================================
    echo    SUCCESS!
    echo ============================================================
    echo.
    echo Migration SQL files have been generated in the "migrations" folder.
    echo.
    echo NEXT STEPS:
    echo 1. Review the SQL files in the "migrations" folder
    echo 2. Run APPLY-MIGRATIONS.bat to apply them to your database
    echo.
) else (
    echo.
    echo ============================================================
    echo    ERROR!
    echo ============================================================
    echo.
    echo Failed to generate migration files.
    echo Check the error messages above.
    echo.
)

echo.
pause
