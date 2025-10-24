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

3. Open your browser and go to:
   - From this computer:     http://localhost:3000
   - From other computers:   http://192.168.0.34:3000

4. Login with:
   Username: ceo
   Password: ceo123

NETWORK ACCESS:
--------------
The server runs on IP: 192.168.0.34
Other computers on your local network can access the application at:
http://192.168.0.34:3000

IMPORTANT: Make sure Windows Firewall allows port 3000!


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

Problem: Can't access from other computers
Solution: 1. Run ALLOW-FIREWALL.bat as Administrator
         2. Make sure the server computer's IP is 192.168.0.34
         3. Check that both computers are on the same network


DATABASE:
---------
The application can use either a remote or local PostgreSQL database.

REMOTE DATABASE (Default - No Setup Required):
Already configured in .env file to use Neon database

LOCAL DATABASE SETUP:
1. Install PostgreSQL from: https://www.postgresql.org/download/windows/
2. Create a database named "gelan_terminal" using pgAdmin
3. Configure PostgreSQL to allow connections:
   - Find pg_hba.conf (usually at C:\Program Files\PostgreSQL\16\data\pg_hba.conf)
   - Open as Administrator with Notepad
   - Add these lines at the TOP:
     host    all             all             192.168.0.34/32        md5
     host    all             all             127.0.0.1/32           md5
   - Save and restart PostgreSQL service (services.msc)
4. Update .env file:
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@192.168.0.34:5432/gelan_terminal
5. Create tables: npm run db:push
6. Create a user: npx tsx scripts/create-user.ts ceo ceo123 "CEO User" CEO
7. Start server: START-WINDOWS.bat

NETWORK DATABASE (For Office Server):
If PostgreSQL is on another computer (e.g., 192.168.0.34):
DATABASE_URL=postgresql://postgres:PASSWORD@192.168.0.34:5432/gelan_terminal


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
