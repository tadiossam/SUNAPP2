================================================================================
  GELAN TERMINAL MAINTENANCE SYSTEM
  Sunshine Construction PLC - Windows Installation Guide
================================================================================

SYSTEM REQUIREMENTS:
-------------------
- Windows 10/11
- Node.js 18+ (Download from https://nodejs.org/)
- Internet connection (for database)


FIRST TIME SETUP:
-----------------
1. Extract all files from the ZIP to a folder (e.g., C:\GelanTerminal\)

2. Double-click: SETUP-FIRST-TIME.bat
   - This will install all dependencies (takes 2-3 minutes)

3. Wait for "SETUP COMPLETE!" message


RUNNING THE APPLICATION:
------------------------
1. Double-click: START-WINDOWS.bat

2. Wait for these messages:
   ✓ Environment: development
   ✓ Starting Vite dev server...
   ✓ Vite dev server ready
   ✓ serving on port 3000

3. Open your browser and go to: http://localhost:3000

4. Login with:
   Username: ceo
   Password: ceo123


STOPPING THE SERVER:
-------------------
- Press Ctrl+C in the Command Prompt window
- Or simply close the window


TROUBLESHOOTING:
---------------
Problem: "Node.js not installed" error
Solution: Download and install from https://nodejs.org/

Problem: Blank page in browser
Solution: Wait 30-60 seconds after starting for Vite to build

Problem: "Port already in use" error
Solution: Close any other programs using port 3000, or change PORT in .env

Problem: Login fails
Solution: Check Command Prompt for error messages


DATABASE:
---------
The application uses a remote PostgreSQL database (Neon).
No local database setup required.
Database URL is configured in the .env file.


IMPORTANT NOTES:
---------------
- Port 3000 is used (port 6000 is blocked by Chrome as unsafe)
- Keep the Command Prompt window open while using the app
- All data is stored in the remote database
- The app connects to the database automatically


SUPPORT:
--------
For issues, check the Command Prompt window for error messages.


================================================================================
Version: 1.0
Last Updated: October 2025
================================================================================
