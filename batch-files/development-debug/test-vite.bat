@echo off
echo Testing Vite setup...
echo.

echo Checking client files...
if exist client\index.html (
    echo ✓ client\index.html found
) else (
    echo ✗ client\index.html NOT found!
)

if exist client\src\main.tsx (
    echo ✓ client\src\main.tsx found
) else (
    echo ✗ client\src\main.tsx NOT found!
)

if exist vite.config.ts (
    echo ✓ vite.config.ts found
) else (
    echo ✗ vite.config.ts NOT found!
)

echo.
echo Checking Vite installation...
if exist node_modules\vite (
    echo ✓ Vite is installed
) else (
    echo ✗ Vite is NOT installed!
    echo Run: npm install
)

echo.
echo Testing Vite directly...
npx vite --version

echo.
pause
