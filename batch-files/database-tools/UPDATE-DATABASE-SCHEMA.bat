@echo off
cls
echo.
echo ============================================================
echo    QUICK DATABASE SCHEMA SYNC (ADVANCED)
echo    Gelan Terminal Maintenance System
echo ============================================================
echo.
echo This will automatically sync your database schema with shared/schema.ts
echo.
echo Target: PostgreSQL database configured in DATABASE_URL
echo.
echo ============================================================
echo    WARNING - READ CAREFULLY
echo ============================================================
echo.
echo This method is ONLY SAFE for simple additive changes like:
echo - Adding new tables
echo - Adding new columns
echo - Adding indexes
echo.
echo This method is NOT SAFE for:
echo - Changing column types
echo - Renaming columns or tables
echo - Deleting columns
echo - Changing constraints
echo.
echo For any destructive changes, use the migration files instead:
echo   1. GENERATE-MIGRATION.bat
echo   2. Review the SQL files
echo   3. APPLY-MIGRATIONS.bat
echo.
echo ============================================================
echo.
choice /C YN /M "Are you sure you want to proceed with quick sync"
if errorlevel 2 goto :cancel
if errorlevel 1 goto :proceed

:cancel
echo.
echo Cancelled. No changes were made to your database.
echo.
echo For safer updates, use:
echo   1. GENERATE-MIGRATION.bat (creates SQL files to review)
echo   2. APPLY-MIGRATIONS.bat (applies the changes)
echo.
pause
exit /b

:proceed
echo.
echo Syncing database schema...
echo.

npm run db:push

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================================
    echo    SUCCESS!
    echo ============================================================
    echo.
    echo Your database schema has been updated successfully!
    echo All tables and columns are now in sync with your code.
    echo.
) else (
    echo.
    echo ============================================================
    echo    SCHEMA PUSH FAILED
    echo ============================================================
    echo.
    echo The schema update failed. This usually happens when:
    echo - Breaking changes detected (column type changes, etc.)
    echo - Database connection issues
    echo - Schema conflicts
    echo.
    echo SAFER APPROACH:
    echo 1. Run GENERATE-MIGRATION.bat to create SQL files
    echo 2. Review the SQL files in the migrations folder
    echo 3. Run APPLY-MIGRATIONS.bat to apply them
    echo.
    echo ADVANCED (Use with caution):
    echo If you understand the risks and have a backup, you can force push:
    echo   npm run db:push -- --force
    echo.
    echo WARNING: --force can DROP tables or columns permanently!
    echo Only use it if you have verified:
    echo   - Database backup is recent and restorable
    echo   - You understand what will be dropped
    echo   - You have a plan to restore lost data
    echo.
)

echo.
pause
