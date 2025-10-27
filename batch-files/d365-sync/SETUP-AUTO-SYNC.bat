@echo off
REM =======================================================================
REM  D365 Auto-Sync Setup Script
REM  This script sets up Windows Task Scheduler to run D365 sync automatically
REM =======================================================================

echo ========================================
echo  D365 Auto-Sync Setup
echo ========================================
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% NEQ 0 (
    echo ERROR: This script must be run as Administrator
    echo Right-click this file and select "Run as administrator"
    echo.
    pause
    exit /b 1
)

REM Get the sync interval from user
set /p SYNC_HOURS=Enter sync interval in hours (e.g., 2 for every 2 hours): 

if "%SYNC_HOURS%"=="" (
    echo ERROR: Sync interval cannot be empty
    pause
    exit /b 1
)

REM Validate input is a number
set "valid=0"
for /f "delims=0123456789" %%i in ("%SYNC_HOURS%") do set "valid=1"
if %valid%==1 (
    echo ERROR: Please enter a valid number
    pause
    exit /b 1
)

echo.
echo Creating scheduled task to run every %SYNC_HOURS% hours...
echo.

REM Delete existing task if it exists
schtasks /delete /tn "D365DataSync" /f >nul 2>&1

REM Create the scheduled task
REM Note: User must place D365-Sync.ps1 in C:\D365Sync\ directory
schtasks /create /tn "D365DataSync" /tr "powershell.exe -ExecutionPolicy Bypass -File C:\D365Sync\D365-Sync.ps1" /sc hourly /mo %SYNC_HOURS% /ru SYSTEM /f

if %errorLevel% EQU 0 (
    echo.
    echo SUCCESS: Auto-sync task created!
    echo.
    echo Task Details:
    echo   Name: D365DataSync
    echo   Runs: Every %SYNC_HOURS% hours
    echo   Script: C:\D365Sync\D365-Sync.ps1
    echo   User: SYSTEM
    echo.
    echo IMPORTANT: Make sure you:
    echo   1. Download D365-Sync.ps1 from Gelan Terminal admin settings
    echo   2. Place it in C:\D365Sync\ folder on your D365 server
    echo   3. Test it manually first by right-clicking and "Run with PowerShell"
    echo.
    echo To view/manage the task:
    echo   - Open Task Scheduler
    echo   - Look for "D365DataSync" in Task Scheduler Library
    echo.
) else (
    echo.
    echo ERROR: Failed to create scheduled task
    echo Please check if you have administrator privileges
    echo.
)

pause
