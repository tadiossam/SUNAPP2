@echo off
setlocal enabledelayedexpansion

REM Create log file
set LOGFILE=debug-log.txt
echo ============================================================ > %LOGFILE%
echo    GELAN TERMINAL - SUPER DEBUG MODE >> %LOGFILE%
echo    %DATE% %TIME% >> %LOGFILE%
echo ============================================================ >> %LOGFILE%
echo. >> %LOGFILE%

echo.
echo ============================================================
echo    GELAN TERMINAL - SUPER DEBUG MODE
echo ============================================================
echo.
echo Creating log file: debug-log.txt
echo.
echo This window will stay open. All output is saved to debug-log.txt
echo.
echo ============================================================
echo.

echo [Step 1] Checking Node.js...
echo [Step 1] Checking Node.js... >> %LOGFILE%
node --version >> %LOGFILE% 2>&1
if errorlevel 1 (
    echo ❌ ERROR: Node.js not found! >> %LOGFILE%
    echo ❌ ERROR: Node.js not found!
    echo Download from: https://nodejs.org/ >> %LOGFILE%
    echo. >> %LOGFILE%
    echo.
    echo See debug-log.txt for details
    pause
    exit /b 1
) else (
    node --version
    echo ✅ Node.js found >> %LOGFILE%
    echo.
)

echo [Step 2] Checking current directory...
echo [Step 2] Checking current directory... >> %LOGFILE%
echo %CD% >> %LOGFILE%
echo %CD%
echo. >> %LOGFILE%
echo.

echo [Step 3] Checking if .env file exists...
echo [Step 3] Checking if .env file exists... >> %LOGFILE%
if exist .env (
    echo ✅ .env file found >> %LOGFILE%
    echo ✅ .env file found
    echo. >> %LOGFILE%
    echo .env contents: >> %LOGFILE%
    type .env >> %LOGFILE%
    echo.
    echo .env contents:
    type .env
) else (
    echo ❌ .env file NOT found! >> %LOGFILE%
    echo ❌ .env file NOT found!
    echo Creating default .env file... >> %LOGFILE%
    (
        echo DATABASE_URL=postgresql://postgres:password@localhost:5432/gelan_terminal
        echo SESSION_SECRET=secret123
        echo PORT=6000
        echo NODE_ENV=development
    ) > .env
    echo ✅ Created .env file >> %LOGFILE%
    echo ✅ Created .env file
    echo. >> %LOGFILE%
    echo ⚠️  Edit .env and add your DATABASE_URL >> %LOGFILE%
    echo.
    notepad .env
)
echo. >> %LOGFILE%
echo.

echo [Step 4] Checking if node_modules exists...
echo [Step 4] Checking if node_modules exists... >> %LOGFILE%
if exist node_modules (
    echo ✅ node_modules found >> %LOGFILE%
    echo ✅ node_modules found
) else (
    echo ❌ node_modules NOT found! >> %LOGFILE%
    echo ❌ node_modules NOT found!
    echo You need to run: setup-windows.bat first! >> %LOGFILE%
    echo.
    echo You need to run setup-windows.bat first!
    echo. >> %LOGFILE%
    echo See debug-log.txt for details
    pause
    exit /b 1
)
echo. >> %LOGFILE%
echo.

echo [Step 5] Checking if cross-env is installed...
echo [Step 5] Checking if cross-env is installed... >> %LOGFILE%
if exist node_modules\cross-env (
    echo ✅ cross-env found >> %LOGFILE%
    echo ✅ cross-env found
) else (
    echo ❌ cross-env NOT found! >> %LOGFILE%
    echo ❌ cross-env NOT found!
    echo Installing cross-env... >> %LOGFILE%
    echo Installing cross-env...
    call npm install cross-env >> %LOGFILE% 2>&1
    echo ✅ cross-env installed >> %LOGFILE%
    echo ✅ cross-env installed
)
echo. >> %LOGFILE%
echo.

echo [Step 6] Checking if tsx is installed...
echo [Step 6] Checking if tsx is installed... >> %LOGFILE%
if exist node_modules\tsx (
    echo ✅ tsx found >> %LOGFILE%
    echo ✅ tsx found
) else (
    echo ❌ tsx NOT found! >> %LOGFILE%
    echo ❌ tsx NOT found!
    echo Installing tsx... >> %LOGFILE%
    echo Installing tsx...
    call npm install tsx >> %LOGFILE% 2>&1
    echo ✅ tsx installed >> %LOGFILE%
    echo ✅ tsx installed
)
echo. >> %LOGFILE%
echo.

echo [Step 7] Attempting to start server...
echo [Step 7] Attempting to start server... >> %LOGFILE%
echo. >> %LOGFILE%
echo Server should be available at: http://localhost:6000 >> %LOGFILE%
echo. >> %LOGFILE%
echo.
echo Server should be available at: http://localhost:6000
echo.
echo Starting server now... (Press Ctrl+C to stop)
echo.
echo ============================================================
echo.

npx cross-env NODE_ENV=development PORT=6000 tsx server/index.ts >> %LOGFILE% 2>&1

echo. >> %LOGFILE%
echo ============================================================ >> %LOGFILE%
echo Server stopped! >> %LOGFILE%
echo ============================================================ >> %LOGFILE%

echo.
echo ============================================================
echo Server stopped!
echo ============================================================
echo.
echo All output has been saved to: debug-log.txt
echo.
echo Please send me the contents of debug-log.txt file!
echo.
pause
