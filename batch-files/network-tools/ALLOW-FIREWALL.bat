@echo off
cls
echo ============================================================
echo    WINDOWS FIREWALL CONFIGURATION
echo    Allow Port 3000 for Network Access
echo ============================================================
echo.
echo This will allow other computers to access the application
echo at: http://192.168.0.34:3000
echo.
echo You need Administrator privileges to run this.
echo.
pause

echo.
echo Adding firewall rule...
echo.

netsh advfirewall firewall add rule name="Gelan Terminal - Port 3000" dir=in action=allow protocol=TCP localport=3000

if errorlevel 1 (
    echo.
    echo ERROR: Failed to add firewall rule!
    echo Please run this file as Administrator:
    echo   1. Right-click on ALLOW-FIREWALL.bat
    echo   2. Select "Run as administrator"
    echo.
) else (
    echo.
    echo ============================================================
    echo    SUCCESS!
    echo ============================================================
    echo.
    echo Port 3000 is now allowed through Windows Firewall.
    echo Other computers can now access: http://192.168.0.34:3000
    echo.
)

pause
