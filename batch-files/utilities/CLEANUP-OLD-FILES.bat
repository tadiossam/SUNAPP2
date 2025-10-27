@echo off
cls
echo ============================================================
echo    CLEANUP - Remove Unnecessary Files
echo ============================================================
echo.
echo This will delete:
echo   - Old batch files (15+ old versions)
echo   - Screenshot images (30+ .png files)
echo   - Debug and test files
echo   - Old documentation files
echo.
echo Files to KEEP:
echo   - START-WINDOWS.bat (run this to start server)
echo   - SETUP-FIRST-TIME.bat (first time setup)
echo   - ALLOW-FIREWALL.bat (configure firewall)
echo   - CHECK-IP.bat (check your IP)
echo   - WINDOWS-README.txt (user guide)
echo.
pause
echo.

cd /d "%~dp0"

echo Deleting old batch files...
del /Q CHECK-INSTALLATION.bat 2>nul
del /Q debug-super.bat 2>nul
del /Q debug-windows.bat 2>nul
del /Q dev-windows.bat 2>nul
del /Q diagnose-vite.bat 2>nul
del /Q FINAL-WINDOWS-RUN.bat 2>nul
del /Q run-app.bat 2>nul
del /Q run-windows-fixed.bat 2>nul
del /Q run-windows.bat 2>nul
del /Q run-with-debug.bat 2>nul
del /Q setup-windows.bat 2>nul
del /Q start-windows-simple.bat 2>nul
del /Q Start.bat 2>nul
del /Q test-vite.bat 2>nul
del /Q WINDOWS-COMPLETE-FIX.bat 2>nul

echo Deleting screenshot images...
del /Q *.png 2>nul

echo Deleting debug and test files...
del /Q debug-log.txt 2>nul
del /Q test-dotenv.js 2>nul
del /Q test-spare-parts-feature.html 2>nul
del /Q fix-bcrypt-windows.js 2>nul

echo Deleting old documentation...
del /Q MANUAL-FIX-INSTRUCTIONS.txt 2>nul
del /Q VERIFICATION_STEPS.md 2>nul
del /Q WINDOWS_QUICK_START.md 2>nul
del /Q WINDOWS_TROUBLESHOOTING.md 2>nul

echo.
echo ============================================================
echo    CLEANUP COMPLETE!
echo ============================================================
echo.
echo Remaining Windows files:
echo   ✓ START-WINDOWS.bat - Start the server
echo   ✓ SETUP-FIRST-TIME.bat - First time setup
echo   ✓ ALLOW-FIREWALL.bat - Configure firewall
echo   ✓ CHECK-IP.bat - Check your IP address
echo   ✓ WINDOWS-README.txt - User guide
echo.
pause
