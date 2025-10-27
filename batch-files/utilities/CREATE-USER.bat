@echo off
cls
echo ============================================================
echo    CREATE NEW USER
echo    Gelan Terminal Maintenance System
echo ============================================================
echo.

cd /d "%~dp0..\.."

echo This script creates a new user with a properly hashed password.
echo.

set /p USERNAME="Enter username: "
set /p PASSWORD="Enter password: "
set /p FULLNAME="Enter full name: "
set /p ROLE="Enter role (CEO/admin/user): "

echo.
echo Creating user "%USERNAME%"...
echo.

npx tsx scripts/create-user.ts "%USERNAME%" "%PASSWORD%" "%FULLNAME%" "%ROLE%"

echo.
pause
