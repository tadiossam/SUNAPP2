@echo off
cls
echo ============================================================
echo    GELAN TERMINAL - DEBUG MODE
echo ============================================================
echo.

cd /d "%~dp0..\.."

echo Setting environment variables...
set NODE_ENV=development
set DEBUG=vite:*
set DATABASE_URL=postgresql://neondb_owner:npg_0h5gnNkiXBES@ep-royal-hill-aepzj67k.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require
set SESSION_SECRET=change-this-to-random-secret-key-12345
set PORT=6000

echo.
echo Environment check:
echo NODE_ENV=%NODE_ENV%
echo PORT=%PORT%
echo DATABASE_URL=%DATABASE_URL:~0,50%...
echo.
echo ============================================================
echo Starting server with debug output...
echo Wait for BOTH messages:
echo   1. [express] serving on port 6000
echo   2. VITE vX.X.X ready in XXX ms
echo ============================================================
echo.

npx cross-env NODE_ENV=development PORT=6000 DATABASE_URL=%DATABASE_URL% tsx server/index.ts

echo.
echo ============================================================
echo Server stopped
echo ============================================================
echo.
pause
