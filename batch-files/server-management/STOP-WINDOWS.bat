@echo off
echo ========================================
echo   STOP GELAN TERMINAL APPLICATION
echo ========================================
echo.

echo Stopping Node.js application on port 3000...
echo.

REM Find the process using port 3000 and kill it
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do (
    echo Found process ID: %%a
    taskkill /F /PID %%a
)

echo.
echo ========================================
echo   Application stopped successfully!
echo ========================================
echo.
echo Press any key to exit...
pause >nul
