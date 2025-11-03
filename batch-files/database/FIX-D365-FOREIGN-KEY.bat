@echo off
cd /d "%~dp0..\.."

echo ============================================================
echo   FIX D365 SETTINGS FOREIGN KEY CONSTRAINT
echo ============================================================
echo.
echo This will fix the foreign key constraint that prevents
echo CEO users from saving D365 settings.
echo.
echo Press Ctrl+C to cancel, or
pause

echo.
echo Applying fix...

psql -h localhost -p 5432 -U postgres -c "ALTER TABLE dynamics365_settings DROP CONSTRAINT IF EXISTS dynamics365_settings_updated_by_fkey; ALTER TABLE dynamics365_settings ADD CONSTRAINT dynamics365_settings_updated_by_users_fkey FOREIGN KEY (updated_by) REFERENCES users(id);"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================================
    echo   SUCCESS! Foreign key constraint fixed.
    echo ============================================================
    echo.
    echo You can now save D365 settings as CEO user.
    echo Please restart your server using START-WINDOWS.bat
    echo.
) else (
    echo.
    echo ============================================================
    echo   ERROR: Failed to fix constraint
    echo ============================================================
    echo.
    echo Please check:
    echo   1. PostgreSQL is running
    echo   2. Database credentials are correct
    echo   3. You have admin privileges
    echo.
)

pause
