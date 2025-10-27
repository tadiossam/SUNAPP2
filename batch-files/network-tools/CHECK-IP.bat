@echo off
cls
echo ============================================================
echo    NETWORK IP ADDRESS CHECK
echo ============================================================
echo.
echo Checking your computer's IP address...
echo.

ipconfig | findstr /i "IPv4"

echo.
echo ============================================================
echo.
echo Your server should be accessible at one of the IPs above.
echo.
echo Expected IP: 192.168.0.34
echo.
echo If your IP is different, update it in the .env file
echo and in START-WINDOWS.bat
echo.
pause
